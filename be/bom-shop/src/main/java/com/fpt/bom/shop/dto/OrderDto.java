package com.fpt.bom.shop.dto;

import com.fpt.bom.shop.dto.CommonDto.StoreRef;
import com.fpt.bom.shop.dto.ReturnDto.ReturnRequestResponse;
import com.fpt.bom.shop.enums.ActorSource;
import com.fpt.bom.shop.enums.JobType;
import com.fpt.bom.shop.enums.OrderStatus;
import com.fpt.bom.shop.enums.PaymentMethod;
import com.fpt.bom.shop.enums.PaymentStatus;
import com.fpt.bom.shop.enums.ReturnRequestStatus;
import com.fpt.core.common.dto.PagingBase;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Checkout, order, lifecycle and review shapes. */
public final class OrderDto {

    private OrderDto() {
    }

    /** Input of {@code /order/preview} and {@code /order/create} (note is ignored by the preview). */
    public record CheckoutRequest(
            @NotNull(message = "{shop.validation.required}") UUID addressId,
            Map<UUID, String> storeVouchers,
            @Size(max = 50, message = "{shop.validation.size}") String platformVoucherCode,
            Map<UUID, String> note) {
    }

    /** Same shape as a cart line ({@code id} is the cart item id). */
    public record PreviewItem(UUID id, UUID productId, UUID variantId, String name, String variantName,
            String imageUrl, BigDecimal price, int quantity, int stock, boolean selected, boolean available) {
    }

    public record StorePreview(UUID storeId, String storeName, List<PreviewItem> items, BigDecimal subtotal,
            BigDecimal shippingFee, BigDecimal storeDiscount) {
    }

    public record OrderPreviewResponse(List<StorePreview> orders, BigDecimal platformDiscount,
            BigDecimal total) {
    }

    public record OrderCreateResponse(List<UUID> orderIds, List<String> codes) {
    }

    public record BuyNowRequest(
            @NotNull(message = "{shop.validation.required}") UUID productId,
            UUID variantId,
            @Min(value = 1, message = "{shop.validation.quantity}")
            @Max(value = 999, message = "{shop.validation.quantity}") int quantity) {
    }

    public record FirstItem(String name, String imageUrl, String variantName, int quantity, BigDecimal price) {
    }

    /**
     * List row shared by buyer, seller, shipper and admin. Everything after {@code createdDate} is additive:
     * delivery data for shippers (pickup info of the store, COD amount), buyer names for sellers/admin.
     */
    public record OrderResponse(UUID id, String code, StoreRef store, OrderStatus status,
            PaymentMethod paymentMethod, PaymentStatus paymentStatus, BigDecimal total, int itemCount,
            FirstItem firstItem, LocalDateTime createdDate, String receiverName, String province,
            BigDecimal shippingFee, BigDecimal shipperFee, String buyerUsername, String buyerName,
            String storeName, String pickupAddress, String storePhone, String storeProvince,
            String receiverPhone, String shippingAddress, BigDecimal codAmount, int failedAttempts,
            JobType jobType, ReturnRequestStatus returnStatus) {
    }

    public record OrderItemResponse(UUID id, UUID productId, UUID variantId, String productName,
            String variantName, String imageUrl, BigDecimal price, int quantity, boolean reviewed) {
    }

    public record OrderHistoryResponse(UUID id, String action, OrderStatus statusBefore, OrderStatus statusAfter,
            String actor, ActorSource source, String note, LocalDateTime createdDate) {
    }

    /**
     * All order columns plus items, history and party names. {@code platformFee}, {@code sellerIncome} and
     * {@code shipperFee} are only filled for the parties allowed to see them.
     * {@code returnRequest} hides the bank fields from the shipper.
     */
    public record OrderDetailResponse(UUID id, String code, String buyerUsername, String buyerName, UUID storeId,
            StoreRef store, String storeName, String pickupAddress, String storePhone, String storeProvince,
            BigDecimal codAmount, String receiverName, String receiverPhone, String shippingAddress, String province,
            BigDecimal subtotal, BigDecimal shippingFee, BigDecimal storeDiscount, BigDecimal platformDiscount,
            BigDecimal total, BigDecimal platformFee, BigDecimal sellerIncome, BigDecimal shipperFee,
            PaymentMethod paymentMethod, PaymentStatus paymentStatus, OrderStatus status, String note,
            String cancelReason, String cancelledBy, String shipperUsername, String shipperName,
            String shipperPhone, int failedAttempts, String deliveryProofUrl, LocalDateTime confirmedAt,
            LocalDateTime shippedAt, LocalDateTime deliveredAt, LocalDateTime completedAt,
            LocalDateTime cancelledAt, UUID storeVoucherId, UUID platformVoucherId, LocalDateTime createdDate,
            List<OrderItemResponse> items, List<OrderHistoryResponse> history, JobType jobType,
            ReturnRequestResponse returnRequest, LocalDateTime refundedAt, String returnShipperUsername,
            LocalDateTime returnDeadline, boolean canRequestReturn) {
    }

    public record CancelRequest(
            @NotNull(message = "{common.id.notNull}") UUID id,
            @NotBlank(message = "{shop.validation.reason}") @Size(max = 500, message = "{shop.validation.reason}")
            String reason) {
    }

    public record DeliveredRequest(
            @NotNull(message = "{common.id.notNull}") UUID id,
            @NotBlank(message = "{shop.validation.required}") @Size(max = 500, message = "{shop.validation.size}")
            String proofImageUrl) {
    }

    public record ReviewCreateRequest(
            @NotNull(message = "{shop.validation.required}") UUID orderItemId,
            @Min(value = 1, message = "{shop.validation.rating}")
            @Max(value = 5, message = "{shop.validation.rating}") int rating,
            @Size(max = 2000, message = "{shop.validation.size}") String comment,
            @Size(max = 5, message = "{shop.validation.size}") List<@NotBlank(message = "{shop.validation.required}")
            @Size(max = 500, message = "{shop.validation.size}") String> imageUrls) {
    }

    /** Order listing filter shared by buyer, seller, shipper and admin screens. */
    @Getter
    @Setter
    public static class OrderFilter extends PagingBase {
        /** One status or a comma-separated list (e.g. CONFIRMED,READY_TO_SHIP). */
        private List<OrderStatus> status;
        private String keyword;
        private UUID storeId;
        /** Shipper listing: province of the delivery address. */
        private String province;
        /** Shipper available list: true lists every province instead of the shipper's own area. */
        private Boolean allProvinces;
        /** Shipper available list: DELIVERY (default), RETURN or ALL. */
        private JobType type;
        /** Admin list: only orders whose return request is in this status (e.g. DISPUTED). */
        private ReturnRequestStatus returnStatus;
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        private LocalDate fromDate;
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        private LocalDate toDate;
    }
}
