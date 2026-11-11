package com.fpt.bom.shop.service.support;

import com.fpt.bom.shop.config.ShopProperties;
import com.fpt.bom.shop.constant.ShopConstants.Action;
import com.fpt.bom.shop.entity.OrderHistory;
import com.fpt.bom.shop.entity.OrderItem;
import com.fpt.bom.shop.entity.ShopOrder;
import com.fpt.bom.shop.entity.Store;
import com.fpt.bom.shop.enums.ActorSource;
import com.fpt.bom.shop.enums.NotificationType;
import com.fpt.bom.shop.enums.OrderStatus;
import com.fpt.bom.shop.enums.PaymentStatus;
import com.fpt.bom.shop.repository.OrderHistoryRepository;
import com.fpt.bom.shop.repository.OrderItemRepository;
import com.fpt.bom.shop.repository.OrderRepository;
import com.fpt.bom.shop.repository.ProductRepository;
import com.fpt.bom.shop.repository.ProductVariantRepository;
import com.fpt.bom.shop.repository.StoreRepository;
import com.fpt.core.common.exception.BaseException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * The single place that moves an order between statuses: it validates the transition, stamps the timestamps,
 * applies the side effects (stock/voucher restore, fees, sold counts), writes the history row and notifies the
 * parties. Callers must hold the order row lock ({@code OrderRepository.lockById}) and run in a transaction.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderTransitions {

    private static final Map<OrderStatus, Set<OrderStatus>> ALLOWED = new EnumMap<>(OrderStatus.class);

    static {
        ALLOWED.put(OrderStatus.PENDING, Set.of(OrderStatus.CONFIRMED, OrderStatus.CANCELLED));
        ALLOWED.put(OrderStatus.CONFIRMED, Set.of(OrderStatus.READY_TO_SHIP, OrderStatus.CANCELLED));
        ALLOWED.put(OrderStatus.READY_TO_SHIP, Set.of(OrderStatus.PICKING));
        ALLOWED.put(OrderStatus.PICKING, Set.of(OrderStatus.SHIPPING));
        ALLOWED.put(OrderStatus.SHIPPING, Set.of(OrderStatus.DELIVERED, OrderStatus.RETURNING));
        ALLOWED.put(OrderStatus.RETURNING, Set.of(OrderStatus.RETURNED));
        ALLOWED.put(OrderStatus.DELIVERED, Set.of(OrderStatus.COMPLETED, OrderStatus.RETURN_REQUESTED));
        ALLOWED.put(OrderStatus.RETURN_REQUESTED, Set.of(OrderStatus.RETURN_APPROVED, OrderStatus.COMPLETED));
        ALLOWED.put(OrderStatus.RETURN_APPROVED, Set.of(OrderStatus.RETURN_SHIPPING));
        ALLOWED.put(OrderStatus.RETURN_SHIPPING, Set.of(OrderStatus.RETURN_RECEIVED));
        ALLOWED.put(OrderStatus.RETURN_RECEIVED, Set.of(OrderStatus.REFUNDED));
    }

    private static final String BUYER_LINK = "/account/orders/";
    private static final String SELLER_LINK = "/seller/orders/";
    private static final String SHIPPER_LINK = "/shipper/orders/";

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderHistoryRepository orderHistoryRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final StoreRepository storeRepository;
    private final VoucherSupport voucherSupport;
    private final NotificationSupport notificationSupport;
    private final ShopProperties shopProperties;

    /** Whether the status table allows {@code from -> to}. */
    public static boolean isAllowed(OrderStatus from, OrderStatus to) {
        return ALLOWED.getOrDefault(from, Set.of()).contains(to);
    }

    /** Loads the order with a row lock; throws 404 when missing. */
    public ShopOrder lock(UUID id) {
        return orderRepository.lockById(id).orElseThrow(() -> new BaseException("APP_DATA404"));
    }

    /**
     * Moves the (locked) order to {@code target}. Field changes that belong to the transition (shipper, proof,
     * cancel reason) must be set on the order <em>before</em> calling, because the side effects run bulk updates.
     */
    public void apply(ShopOrder order, OrderStatus target, String action, ActorSource source, String actor,
            String note) {
        OrderStatus before = order.getStatus();
        if (!isAllowed(before, target)) {
            throw new BaseException("shop.order.invalidTransition");
        }
        LocalDateTime now = LocalDateTime.now();
        order.setStatus(target);
        switch (target) {
            case CONFIRMED -> order.setConfirmedAt(now);
            case SHIPPING -> order.setShippedAt(now);
            case DELIVERED -> {
                order.setDeliveredAt(now);
                order.setPaymentStatus(PaymentStatus.PAID);
            }
            case COMPLETED -> {
                order.setCompletedAt(now);
                settleFees(order);
            }
            case REFUNDED -> {
                order.setRefundedAt(now);
                settleRefund(order);
            }
            case CANCELLED -> {
                order.setCancelledAt(now);
                order.setCancelledBy(source.name());
            }
            default -> {
            }
        }
        orderRepository.saveAndFlush(order);

        List<OrderItem> items = orderItemRepository.findByOrderIdOrderByCreatedDateAsc(order.getId());
        if (target == OrderStatus.CANCELLED || target == OrderStatus.RETURNED
                || target == OrderStatus.RETURN_RECEIVED) {
            restoreStock(items);
        }
        if (target == OrderStatus.CANCELLED) {
            voucherSupport.restore(order.getId());
        }
        if (target == OrderStatus.COMPLETED) {
            items.forEach(item -> productRepository.incrementSold(item.getProductId(), item.getQuantity()));
        }

        writeHistory(order, action, before, target, source, actor, note);
        notifyParties(order, before, target, source, note);
        log.info("Order transition: id={}, {} -> {}, action={}, actor={}", order.getId(), before, target, action,
                actor);
    }

    /** Records an event that does not change the status (a failed delivery attempt, a rejected return). */
    public void recordEvent(ShopOrder order, String action, ActorSource source, String actor, String note) {
        writeHistory(order, action, order.getStatus(), order.getStatus(), source, actor, note);
    }

    /** Writes the very first history row of a freshly created order. */
    public void recordCreated(ShopOrder order, String actor) {
        writeHistory(order, Action.CREATE, null, order.getStatus(), ActorSource.BUYER, actor, null);
    }

    /** Auto-completes a DELIVERED order whose buyer never confirmed receipt. */
    @Transactional
    public void autoComplete(UUID orderId) {
        ShopOrder order = lock(orderId);
        if (order.getStatus() != OrderStatus.DELIVERED) {
            return;
        }
        apply(order, OrderStatus.COMPLETED, Action.AUTO_COMPLETE, ActorSource.SYSTEM, "system", null);
    }

    private void settleFees(ShopOrder order) {
        ShopProperties.Order cfg = shopProperties.getOrder();
        BigDecimal base = order.getSubtotal().subtract(order.getStoreDiscount()).max(BigDecimal.ZERO);
        BigDecimal platformFee = base.multiply(BigDecimal.valueOf(cfg.getPlatformFeePercent()))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        order.setPlatformFee(platformFee);
        order.setSellerIncome(base.subtract(platformFee));
        order.setShipperFee(shipperFee(order));
    }

    /** A refunded order earns the store and the platform nothing; the delivery was still done, so the shipper is paid. */
    private void settleRefund(ShopOrder order) {
        order.setPlatformFee(BigDecimal.ZERO);
        order.setSellerIncome(BigDecimal.ZERO);
        order.setShipperFee(shipperFee(order));
    }

    private BigDecimal shipperFee(ShopOrder order) {
        return order.getShippingFee().multiply(BigDecimal.valueOf(shopProperties.getOrder().getShipperFeePercent()))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    private void restoreStock(List<OrderItem> items) {
        for (OrderItem item : items) {
            if (item.getVariantId() != null) {
                productVariantRepository.incrementStock(item.getVariantId(), item.getQuantity());
            }
            productRepository.incrementStock(item.getProductId(), item.getQuantity());
        }
    }

    private void writeHistory(ShopOrder order, String action, OrderStatus before, OrderStatus after,
            ActorSource source, String actor, String note) {
        OrderHistory history = new OrderHistory();
        history.setOrderId(order.getId());
        history.setAction(action);
        history.setStatusBefore(before);
        history.setStatusAfter(after);
        history.setActor(TextSupport.truncate(actor, 50));
        history.setSource(source);
        history.setNote(TextSupport.truncate(note, 500));
        orderHistoryRepository.save(history);
    }

    private void notifyParties(ShopOrder order, OrderStatus before, OrderStatus target, ActorSource source,
            String note) {
        Optional<Store> store = storeRepository.findById(order.getStoreId());
        String seller = store.map(Store::getOwnerUsername).orElse(null);
        String buyerLink = BUYER_LINK + order.getId();
        String sellerLink = SELLER_LINK + order.getId();
        String code = order.getCode();
        switch (target) {
            case CONFIRMED -> notifyBuyer(order, "shop.notify.order.confirmed", null, buyerLink, code);
            case PICKING -> {
                notifyBuyer(order, "shop.notify.order.picking", null, buyerLink, code);
                notifySeller(seller, "shop.notify.order.picking.seller", null, sellerLink, code);
            }
            case SHIPPING -> notifyBuyer(order, "shop.notify.order.shipping", null, buyerLink, code);
            case DELIVERED -> {
                notifyBuyer(order, "shop.notify.order.delivered", null, buyerLink, code);
                notifySeller(seller, "shop.notify.order.delivered.seller", null, sellerLink, code);
            }
            case COMPLETED -> {
                if (before == OrderStatus.RETURN_REQUESTED) {
                    notifyReturnClosed(order, seller, source, note);
                } else {
                    notifySeller(seller, "shop.notify.order.completed.seller", null, sellerLink, code);
                }
                if (order.getShipperUsername() != null) {
                    notificationSupport.send(order.getShipperUsername(), NotificationType.ORDER,
                            "shop.notify.order.completed.shipper", null, SHIPPER_LINK + order.getId(), code);
                }
            }
            case CANCELLED -> {
                if (source != ActorSource.BUYER) {
                    notifyBuyer(order, "shop.notify.order.cancelled", note, buyerLink, code);
                }
                if (source != ActorSource.SELLER) {
                    notifySeller(seller, "shop.notify.order.cancelled.seller", note, sellerLink, code);
                }
            }
            case RETURNING -> {
                notifyBuyer(order, "shop.notify.order.returning", note, buyerLink, code);
                notifySeller(seller, "shop.notify.order.returning.seller", note, sellerLink, code);
            }
            case RETURNED -> {
                notifyBuyer(order, "shop.notify.order.returned", note, buyerLink, code);
                if (order.getShipperUsername() != null) {
                    notificationSupport.send(order.getShipperUsername(), NotificationType.ORDER,
                            "shop.notify.order.returned.shipper", null, SHIPPER_LINK + order.getId(), code);
                }
            }
            case RETURN_REQUESTED ->
                notifySeller(seller, "shop.notify.return.requested.seller", note, sellerLink, code);
            case RETURN_APPROVED -> notifyReturnApproved(order, seller, source, note);
            case RETURN_SHIPPING -> {
                notifyBuyer(order, "shop.notify.return.shipping", null, buyerLink, code);
                notifySeller(seller, "shop.notify.return.shipping.seller", null, sellerLink, code);
            }
            case RETURN_RECEIVED -> {
                notifyBuyer(order, "shop.notify.return.received", null, buyerLink, code);
                if (order.getReturnShipperUsername() != null) {
                    notificationSupport.send(order.getReturnShipperUsername(), NotificationType.ORDER,
                            "shop.notify.return.received.shipper", null, SHIPPER_LINK + order.getId(), code);
                }
            }
            case REFUNDED -> {
                notifyBuyer(order, "shop.notify.return.refunded", note, buyerLink, code);
                if (source == ActorSource.ADMIN) {
                    notifySeller(seller, "shop.notify.return.refunded.seller", note, sellerLink, code);
                }
                if (order.getShipperUsername() != null) {
                    notificationSupport.send(order.getShipperUsername(), NotificationType.ORDER,
                            "shop.notify.order.completed.shipper", null, SHIPPER_LINK + order.getId(), code);
                }
            }
            default -> {
            }
        }
    }

    /** The return was approved by the seller, automatically (timeout) or by an admin dispute decision. */
    private void notifyReturnApproved(ShopOrder order, String seller, ActorSource source, String note) {
        String buyerLink = BUYER_LINK + order.getId();
        String sellerLink = SELLER_LINK + order.getId();
        String code = order.getCode();
        switch (source) {
            case SYSTEM -> {
                notifyBuyer(order, "shop.notify.return.autoApproved", null, buyerLink, code);
                notifySeller(seller, "shop.notify.return.autoApproved.seller", null, sellerLink, code);
            }
            case ADMIN -> {
                notifyBuyer(order, "shop.notify.return.resolvedApproved", note, buyerLink, code);
                notifySeller(seller, "shop.notify.return.resolvedApproved.seller", note, sellerLink, code);
            }
            default -> notifyBuyer(order, "shop.notify.return.approved", note, buyerLink, code);
        }
    }

    /** A return request ended with the order completing: withdrawn, closed after no dispute, or rejected by admin. */
    private void notifyReturnClosed(ShopOrder order, String seller, ActorSource source, String note) {
        String buyerLink = BUYER_LINK + order.getId();
        String sellerLink = SELLER_LINK + order.getId();
        String code = order.getCode();
        switch (source) {
            case BUYER -> notifySeller(seller, "shop.notify.return.withdrawn.seller", null, sellerLink, code);
            case SYSTEM -> {
                notifyBuyer(order, "shop.notify.return.autoClosed", null, buyerLink, code);
                notifySeller(seller, "shop.notify.return.autoClosed.seller", null, sellerLink, code);
            }
            default -> {
                notifyBuyer(order, "shop.notify.return.resolvedRejected", note, buyerLink, code);
                notifySeller(seller, "shop.notify.return.resolvedRejected.seller", note, sellerLink, code);
            }
        }
    }

    /** Public so the delivery-failed flow and the return flow (no status change) can reuse the same targets. */
    public void notifyBuyer(ShopOrder order, String titleKey, String content, String link, Object... args) {
        notificationSupport.send(order.getBuyerUsername(), NotificationType.ORDER, titleKey, content, link, args);
    }

    /** Notifies the owner of the order's store (link = the order in Seller Center). */
    public void notifyStoreOwner(ShopOrder order, String titleKey, String content, Object... args) {
        storeRepository.findById(order.getStoreId()).map(Store::getOwnerUsername).ifPresent(
                owner -> notifySeller(owner, titleKey, content, SELLER_LINK + order.getId(), args));
    }

    private void notifySeller(String seller, String titleKey, String content, String link, Object... args) {
        notificationSupport.send(seller, NotificationType.ORDER, titleKey, content, link, args);
    }
}
