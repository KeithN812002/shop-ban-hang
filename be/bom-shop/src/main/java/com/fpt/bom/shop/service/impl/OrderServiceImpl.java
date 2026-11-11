package com.fpt.bom.shop.service.impl;

import com.fpt.bom.shop.constant.ShopConstants.Action;
import com.fpt.bom.shop.dto.OrderDto.CancelRequest;
import com.fpt.bom.shop.dto.OrderDto.CheckoutRequest;
import com.fpt.bom.shop.dto.OrderDto.OrderCreateResponse;
import com.fpt.bom.shop.dto.OrderDto.OrderDetailResponse;
import com.fpt.bom.shop.dto.OrderDto.OrderFilter;
import com.fpt.bom.shop.dto.OrderDto.OrderPreviewResponse;
import com.fpt.bom.shop.dto.OrderDto.OrderResponse;
import com.fpt.bom.shop.dto.OrderDto.PreviewItem;
import com.fpt.bom.shop.dto.OrderDto.StorePreview;
import com.fpt.bom.shop.dto.ReturnDto.ReturnCreateRequest;
import com.fpt.bom.shop.dto.ReturnDto.ReturnDisputeRequest;
import com.fpt.bom.shop.dto.ReturnDto.ReturnWithdrawRequest;
import com.fpt.bom.shop.entity.Address;
import com.fpt.bom.shop.entity.OrderItem;
import com.fpt.bom.shop.entity.ShopOrder;
import com.fpt.bom.shop.enums.ActorSource;
import com.fpt.bom.shop.enums.NotificationType;
import com.fpt.bom.shop.enums.OrderStatus;
import com.fpt.bom.shop.enums.PaymentMethod;
import com.fpt.bom.shop.enums.PaymentStatus;
import com.fpt.bom.shop.repository.CartItemRepository;
import com.fpt.bom.shop.repository.OrderItemRepository;
import com.fpt.bom.shop.repository.OrderRepository;
import com.fpt.bom.shop.repository.ProductRepository;
import com.fpt.bom.shop.repository.ProductVariantRepository;
import com.fpt.bom.shop.service.OrderService;
import com.fpt.bom.shop.service.support.AccessSupport;
import com.fpt.bom.shop.service.support.CheckoutPlanner;
import com.fpt.bom.shop.service.support.CheckoutPlanner.PlanItem;
import com.fpt.bom.shop.service.support.CheckoutPlanner.StorePlan;
import com.fpt.bom.shop.service.support.NotificationSupport;
import com.fpt.bom.shop.service.support.OrderAssembler;
import com.fpt.bom.shop.service.support.OrderAssembler.Viewer;
import com.fpt.bom.shop.service.support.OrderSpecs;
import com.fpt.bom.shop.service.support.OrderTransitions;
import com.fpt.bom.shop.service.support.ReturnSupport;
import com.fpt.bom.shop.service.support.TextSupport;
import com.fpt.bom.shop.service.support.VoucherSupport;
import com.fpt.core.common.dto.PageResult;
import com.fpt.core.common.exception.BaseException;
import com.fpt.core.persistence.spec.SpecificationBuilder;
import com.fpt.core.persistence.util.PageableUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

import static com.fpt.core.persistence.spec.JpaFieldSpecifications.eq;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private static final int CODE_ATTEMPTS = 8;
    private static final String CODE_PREFIX = "SBH";

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final CheckoutPlanner checkoutPlanner;
    private final VoucherSupport voucherSupport;
    private final OrderTransitions orderTransitions;
    private final OrderAssembler orderAssembler;
    private final NotificationSupport notificationSupport;
    private final AccessSupport accessSupport;
    private final ReturnSupport returnSupport;

    @Override
    @Transactional(readOnly = true)
    public OrderPreviewResponse preview(CheckoutRequest request) {
        CheckoutPlanner.Plan plan = checkoutPlanner.plan(accessSupport.currentUsername(), request);
        List<StorePreview> previews = plan.stores().stream().map(sp -> new StorePreview(sp.store().getId(),
                sp.store().getName(), sp.items().stream().map(this::toPreviewItem).toList(), sp.subtotal(),
                sp.shippingFee(), sp.storeDiscount())).toList();
        return new OrderPreviewResponse(previews, plan.platformDiscount(), plan.total());
    }

    @Override
    @Transactional
    public OrderCreateResponse create(CheckoutRequest request) {
        String username = accessSupport.currentUsername();
        CheckoutPlanner.Plan plan = checkoutPlanner.plan(username, request);
        Address address = plan.address();

        List<UUID> orderIds = new ArrayList<>();
        List<String> codes = new ArrayList<>();
        boolean platformVoucherRecorded = false;
        for (StorePlan storePlan : plan.stores()) {
            ShopOrder order = buildOrder(username, address, storePlan, request, plan);
            orderRepository.save(order);
            List<OrderItem> items = storePlan.items().stream().map(item -> toOrderItem(order, item)).toList();
            orderItemRepository.saveAll(items);
            orderRepository.flush();

            for (PlanItem item : storePlan.items()) {
                reserveStock(item);
            }
            if (storePlan.storeVoucher() != null) {
                voucherSupport.consume(storePlan.storeVoucher(), order.getId(), username);
            }
            if (plan.platformVoucher() != null && !platformVoucherRecorded) {
                voucherSupport.consume(plan.platformVoucher(), order.getId(), username);
                platformVoucherRecorded = true;
            }
            orderTransitions.recordCreated(order, username);
            notifyCreated(order, storePlan);
            orderIds.add(order.getId());
            codes.add(order.getCode());
        }
        cartItemRepository.deleteAll(cartItemRepository.findByUsernameAndSelectedTrueOrderByCreatedDateAsc(username));
        log.info("Checkout completed: user={}, orders={}", username, codes);
        return new OrderCreateResponse(orderIds, codes);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResult<OrderResponse> search(OrderFilter filter) {
        SpecificationBuilder<ShopOrder> builder = OrderSpecs.fromFilter(filter);
        builder.and(eq("buyerUsername", accessSupport.currentUsername()));
        Page<ShopOrder> page = orderRepository.findAll(builder.build(),
                Objects.requireNonNull(PageableUtils.pageable(filter)));
        return new PageResult<>(orderAssembler.toResponses(page.getContent()), page.getTotalElements(),
                page.getTotalPages(), page.getNumber() + 1, page.getSize());
    }

    @Override
    @Transactional(readOnly = true)
    public OrderDetailResponse detail(UUID id) {
        ShopOrder order = orderRepository.findByIdAndBuyerUsername(Objects.requireNonNull(id),
                accessSupport.currentUsername()).orElseThrow(() -> new BaseException("APP_DATA404"));
        return orderAssembler.toDetail(order, Viewer.BUYER);
    }

    @Override
    @Transactional
    public void cancel(CancelRequest request) {
        String username = accessSupport.currentUsername();
        ShopOrder order = lockOwned(request.id(), username);
        String reason = request.reason().trim();
        order.setCancelReason(reason);
        orderTransitions.apply(order, OrderStatus.CANCELLED, Action.CANCEL, ActorSource.BUYER, username, reason);
    }

    @Override
    @Transactional
    public void confirmReceived(UUID id) {
        String username = accessSupport.currentUsername();
        ShopOrder order = lockOwned(id, username);
        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new BaseException("shop.order.invalidTransition");
        }
        orderTransitions.apply(order, OrderStatus.COMPLETED, Action.CONFIRM_RECEIVED, ActorSource.BUYER, username,
                null);
    }

    @Override
    @Transactional
    public void requestReturn(ReturnCreateRequest request) {
        String username = accessSupport.currentUsername();
        returnSupport.request(lockOwned(request.orderId(), username), request, username);
    }

    @Override
    @Transactional
    public void disputeReturn(ReturnDisputeRequest request) {
        String username = accessSupport.currentUsername();
        returnSupport.dispute(lockOwned(request.orderId(), username), request.reason(), username);
    }

    @Override
    @Transactional
    public void withdrawReturn(ReturnWithdrawRequest request) {
        String username = accessSupport.currentUsername();
        returnSupport.withdraw(lockOwned(request.orderId(), username), username);
    }

    private ShopOrder lockOwned(UUID id, String username) {
        ShopOrder order = orderTransitions.lock(Objects.requireNonNull(id));
        if (!order.getBuyerUsername().equals(username)) {
            throw new BaseException("APP_DATA404");
        }
        return order;
    }

    private PreviewItem toPreviewItem(PlanItem item) {
        int stock = item.variant() != null ? item.variant().getStock() : item.product().getStock();
        return new PreviewItem(item.cartItemId(), item.product().getId(),
                item.variant() != null ? item.variant().getId() : null, item.product().getName(),
                item.variant() != null ? item.variant().getName() : null, item.product().getThumbnailUrl(),
                item.unitPrice(), item.quantity(), stock, true, true);
    }

    private ShopOrder buildOrder(String username, Address address, StorePlan storePlan, CheckoutRequest request,
            CheckoutPlanner.Plan plan) {
        ShopOrder order = new ShopOrder();
        order.setCode(generateCode());
        order.setBuyerUsername(username);
        order.setStoreId(storePlan.store().getId());
        order.setReceiverName(address.getReceiverName());
        order.setReceiverPhone(address.getPhone());
        order.setShippingAddress(formatAddress(address));
        order.setProvince(address.getProvince());
        order.setSubtotal(storePlan.subtotal());
        order.setShippingFee(storePlan.shippingFee());
        order.setStoreDiscount(storePlan.storeDiscount());
        order.setPlatformDiscount(storePlan.platformDiscount());
        order.setTotal(storePlan.total());
        order.setPaymentMethod(PaymentMethod.COD);
        order.setPaymentStatus(PaymentStatus.UNPAID);
        order.setStatus(OrderStatus.PENDING);
        String note = request.note() == null ? null : request.note().get(storePlan.store().getId());
        order.setNote(TextSupport.truncate(TextSupport.blankToNull(note), 500));
        order.setStoreVoucherId(storePlan.storeVoucher() != null ? storePlan.storeVoucher().getId() : null);
        order.setPlatformVoucherId(plan.platformVoucher() != null ? plan.platformVoucher().getId() : null);
        order.setPlatformFee(BigDecimal.ZERO);
        order.setSellerIncome(BigDecimal.ZERO);
        order.setShipperFee(BigDecimal.ZERO);
        return order;
    }

    private OrderItem toOrderItem(ShopOrder order, PlanItem item) {
        OrderItem line = new OrderItem();
        line.setOrderId(order.getId());
        line.setProductId(item.product().getId());
        line.setVariantId(item.variant() != null ? item.variant().getId() : null);
        line.setProductName(item.product().getName());
        line.setVariantName(item.variant() != null ? item.variant().getName() : null);
        line.setImageUrl(item.product().getThumbnailUrl());
        line.setPrice(item.unitPrice());
        line.setQuantity(item.quantity());
        line.setReviewed(false);
        return line;
    }

    /** Atomic conditional decrements: they affect no row when stock ran out, which aborts the checkout. */
    private void reserveStock(PlanItem item) {
        if (item.variant() != null
                && productVariantRepository.decrementStock(item.variant().getId(), item.quantity()) == 0) {
            throw new BaseException("shop.stock.insufficient", item.product().getName());
        }
        if (productRepository.decrementStock(item.product().getId(), item.quantity()) == 0) {
            throw new BaseException("shop.stock.insufficient", item.product().getName());
        }
    }

    private void notifyCreated(ShopOrder order, StorePlan storePlan) {
        notificationSupport.send(order.getBuyerUsername(), NotificationType.ORDER, "shop.notify.order.created",
                null, "/account/orders/" + order.getId(), order.getCode());
        notificationSupport.send(storePlan.store().getOwnerUsername(), NotificationType.ORDER,
                "shop.notify.order.created.seller", null, "/seller/orders/" + order.getId(), order.getCode());
    }

    private String generateCode() {
        for (int attempt = 0; attempt < CODE_ATTEMPTS; attempt++) {
            String code = CODE_PREFIX + java.time.LocalDate.now().format(
                    java.time.format.DateTimeFormatter.ofPattern("yyMMdd")) + TextSupport.randomDigits(6);
            if (!orderRepository.existsByCode(code)) {
                return code;
            }
        }
        throw new BaseException("shop.order.codeGeneration");
    }

    private static String formatAddress(Address a) {
        List<String> parts = new ArrayList<>();
        parts.add(a.getDetail());
        if (a.getWard() != null) {
            parts.add(a.getWard());
        }
        if (a.getDistrict() != null) {
            parts.add(a.getDistrict());
        }
        parts.add(a.getProvince());
        return String.join(", ", parts);
    }
}
