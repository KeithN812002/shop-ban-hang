package com.fpt.bom.shop.service.support;

import com.fpt.bom.shop.config.ShopProperties;
import com.fpt.bom.shop.dto.CommonDto.StoreRef;
import com.fpt.bom.shop.dto.OrderDto.FirstItem;
import com.fpt.bom.shop.dto.OrderDto.OrderDetailResponse;
import com.fpt.bom.shop.dto.OrderDto.OrderHistoryResponse;
import com.fpt.bom.shop.dto.OrderDto.OrderItemResponse;
import com.fpt.bom.shop.dto.OrderDto.OrderResponse;
import com.fpt.bom.shop.dto.ReturnDto.ReturnRequestResponse;
import com.fpt.bom.shop.entity.OrderItem;
import com.fpt.bom.shop.entity.ReturnRequest;
import com.fpt.bom.shop.entity.Shipper;
import com.fpt.bom.shop.entity.ShopOrder;
import com.fpt.bom.shop.entity.Store;
import com.fpt.bom.shop.enums.JobType;
import com.fpt.bom.shop.enums.OrderStatus;
import com.fpt.bom.shop.enums.PaymentStatus;
import com.fpt.bom.shop.enums.ReturnRequestStatus;
import com.fpt.bom.shop.repository.OrderHistoryRepository;
import com.fpt.bom.shop.repository.OrderItemRepository;
import com.fpt.bom.shop.repository.ReturnRequestRepository;
import com.fpt.bom.shop.repository.ShipperRepository;
import com.fpt.bom.shop.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Builds order list rows and order details, hiding financial columns from parties that must not see them. */
@Component
@RequiredArgsConstructor
public class OrderAssembler {

    /** Who is looking at the order. */
    public enum Viewer {
        BUYER, SELLER, SHIPPER, ADMIN
    }

    private final StoreRepository storeRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderHistoryRepository orderHistoryRepository;
    private final ShipperRepository shipperRepository;
    private final ReturnRequestRepository returnRequestRepository;
    private final UserDirectory userDirectory;
    private final ShopProperties shopProperties;

    public List<OrderResponse> toResponses(Collection<ShopOrder> orders) {
        if (orders.isEmpty()) {
            return List.of();
        }
        List<UUID> orderIds = orders.stream().map(ShopOrder::getId).toList();
        Map<UUID, List<OrderItem>> items = orderItemRepository.findByOrderIdIn(orderIds).stream()
                .collect(Collectors.groupingBy(OrderItem::getOrderId));
        Map<UUID, Store> stores = storeRepository
                .findAllById(orders.stream().map(ShopOrder::getStoreId).distinct().toList()).stream()
                .collect(Collectors.toMap(Store::getId, Function.identity()));
        Map<UUID, ReturnRequestStatus> returnStatuses = returnRequestRepository.findByOrderIdIn(orderIds).stream()
                .collect(Collectors.toMap(ReturnRequest::getOrderId, ReturnRequest::getStatus));

        Map<String, String> buyerNames = userDirectory
                .displayNames(orders.stream().map(ShopOrder::getBuyerUsername).toList());
        return orders.stream().map(o -> {
            List<OrderItem> lines = items.getOrDefault(o.getId(), List.of()).stream()
                    .sorted((a, b) -> a.getCreatedDate().compareTo(b.getCreatedDate())).toList();
            OrderItem first = lines.isEmpty() ? null : lines.get(0);
            Store store = stores.get(o.getStoreId());
            return new OrderResponse(o.getId(), o.getCode(),
                    new StoreRef(o.getStoreId(), store != null ? store.getName() : null), o.getStatus(),
                    o.getPaymentMethod(), o.getPaymentStatus(), o.getTotal(),
                    lines.stream().mapToInt(OrderItem::getQuantity).sum(),
                    first == null ? null : new FirstItem(first.getProductName(), first.getImageUrl(),
                            first.getVariantName(), first.getQuantity(), first.getPrice()),
                    o.getCreatedDate(), o.getReceiverName(), o.getProvince(), o.getShippingFee(),
                    o.getShipperFee(), o.getBuyerUsername(), buyerNames.get(o.getBuyerUsername()),
                    store != null ? store.getName() : null, store != null ? store.getAddress() : null,
                    store != null ? store.getPhone() : null, store != null ? store.getProvince() : null,
                    o.getReceiverPhone(), o.getShippingAddress(), codAmount(o), o.getFailedAttempts(), jobType(o),
                    returnStatuses.get(o.getId()));
        }).toList();
    }

    /** RETURN while the goods are being collected from the buyer, otherwise the normal delivery. */
    public static JobType jobType(ShopOrder o) {
        return o.getStatus() == OrderStatus.RETURN_APPROVED || o.getStatus() == OrderStatus.RETURN_SHIPPING
                ? JobType.RETURN : JobType.DELIVERY;
    }

    /** Cash the shipper must collect: the order total while still unpaid, otherwise nothing (never on a return job). */
    private static BigDecimal codAmount(ShopOrder o) {
        return o.getPaymentStatus() == PaymentStatus.UNPAID && jobType(o) == JobType.DELIVERY ? o.getTotal()
                : BigDecimal.ZERO;
    }

    public OrderDetailResponse toDetail(ShopOrder o, Viewer viewer) {
        Store store = storeRepository.findById(o.getStoreId()).orElse(null);
        Shipper shipper = o.getShipperUsername() == null ? null
                : shipperRepository.findByUsername(o.getShipperUsername()).orElse(null);
        List<OrderItemResponse> items = orderItemRepository.findByOrderIdOrderByCreatedDateAsc(o.getId()).stream()
                .map(i -> new OrderItemResponse(i.getId(), i.getProductId(), i.getVariantId(), i.getProductName(),
                        i.getVariantName(), i.getImageUrl(), i.getPrice(), i.getQuantity(), i.isReviewed()))
                .toList();
        List<OrderHistoryResponse> history = orderHistoryRepository
                .findByOrderIdOrderByCreatedDateAsc(o.getId()).stream()
                .map(h -> new OrderHistoryResponse(h.getId(), h.getAction(), h.getStatusBefore(),
                        h.getStatusAfter(), h.getActor(), h.getSource(), h.getNote(), h.getCreatedDate()))
                .toList();
        ShopProperties.Order cfg = shopProperties.getOrder();
        ReturnRequestResponse returnRequest = returnRequestRepository.findByOrderId(o.getId())
                .map(r -> toReturnResponse(r, cfg, viewer != Viewer.SHIPPER)).orElse(null);
        LocalDateTime returnDeadline = o.getStatus() == OrderStatus.DELIVERED
                ? ReturnRules.returnDeadline(o.getDeliveredAt(), cfg.getReturnWindowDays()) : null;
        boolean canRequestReturn = viewer == Viewer.BUYER
                && ReturnRules.canRequestReturn(o, cfg, LocalDateTime.now());

        boolean seesPlatformFinance = viewer == Viewer.SELLER || viewer == Viewer.ADMIN;
        boolean seesShipperFee = viewer == Viewer.SHIPPER || viewer == Viewer.ADMIN;
        return new OrderDetailResponse(o.getId(), o.getCode(), o.getBuyerUsername(),
                userDirectory.displayName(o.getBuyerUsername()), o.getStoreId(),
                new StoreRef(o.getStoreId(), store != null ? store.getName() : null),
                store != null ? store.getName() : null, store != null ? store.getAddress() : null,
                store != null ? store.getPhone() : null, store != null ? store.getProvince() : null, codAmount(o),
                o.getReceiverName(),
                o.getReceiverPhone(), o.getShippingAddress(), o.getProvince(), o.getSubtotal(),
                o.getShippingFee(), o.getStoreDiscount(), o.getPlatformDiscount(), o.getTotal(),
                seesPlatformFinance ? o.getPlatformFee() : null,
                seesPlatformFinance ? o.getSellerIncome() : null, seesShipperFee ? o.getShipperFee() : null,
                o.getPaymentMethod(), o.getPaymentStatus(), o.getStatus(), o.getNote(), o.getCancelReason(),
                o.getCancelledBy(), o.getShipperUsername(), shipper != null ? shipper.getFullName() : null,
                shipper != null ? shipper.getPhone() : null, o.getFailedAttempts(), o.getDeliveryProofUrl(),
                o.getConfirmedAt(), o.getShippedAt(), o.getDeliveredAt(), o.getCompletedAt(), o.getCancelledAt(),
                o.getStoreVoucherId(), o.getPlatformVoucherId(), o.getCreatedDate(), items, history, jobType(o),
                returnRequest, o.getRefundedAt(), o.getReturnShipperUsername(), returnDeadline, canRequestReturn);
    }

    /** {@code showBank} false (shipper view) leaves the bank fields {@code null}. */
    static ReturnRequestResponse toReturnResponse(ReturnRequest r, ShopProperties.Order cfg, boolean showBank) {
        return new ReturnRequestResponse(r.getId(), r.getReasonCode(), r.getDescription(),
                TextSupport.splitCsv(r.getImageUrls()), showBank ? r.getBankName() : null,
                showBank ? r.getBankAccountNo() : null, showBank ? r.getBankAccountName() : null,
                r.getRefundAmount(), r.getStatus(), r.getSellerNote(), r.getDisputeReason(), r.getAdminNote(),
                r.getRefundProofUrl(), r.getRefundNote(), r.getRequestedAt(), r.getRespondedAt(), r.getDisputedAt(),
                r.getResolvedAt(), r.getRefundedAt(), ReturnRules.responseDeadline(r, cfg),
                ReturnRules.disputeDeadline(r, cfg));
    }
}
