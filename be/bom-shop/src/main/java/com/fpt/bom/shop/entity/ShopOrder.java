package com.fpt.bom.shop.entity;

import com.fpt.bom.shop.enums.OrderStatus;
import com.fpt.bom.shop.enums.PaymentMethod;
import com.fpt.bom.shop.enums.PaymentStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "shop_order")
public class ShopOrder extends ShopEntity {

    @Version
    @Column(name = "version", nullable = false)
    private long version;

    @Column(name = "code", length = 20, nullable = false, unique = true)
    private String code;

    @Column(name = "buyer_username", length = 50, nullable = false)
    private String buyerUsername;

    @Column(name = "store_id", nullable = false)
    private UUID storeId;

    @Column(name = "receiver_name", length = 200, nullable = false)
    private String receiverName;

    @Column(name = "receiver_phone", length = 30, nullable = false)
    private String receiverPhone;

    @Column(name = "shipping_address", length = 1000, nullable = false)
    private String shippingAddress;

    @Column(name = "province", length = 100)
    private String province;

    @Column(name = "subtotal", precision = 15, scale = 2, nullable = false)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "shipping_fee", precision = 15, scale = 2, nullable = false)
    private BigDecimal shippingFee = BigDecimal.ZERO;

    @Column(name = "store_discount", precision = 15, scale = 2, nullable = false)
    private BigDecimal storeDiscount = BigDecimal.ZERO;

    @Column(name = "platform_discount", precision = 15, scale = 2, nullable = false)
    private BigDecimal platformDiscount = BigDecimal.ZERO;

    @Column(name = "total", precision = 15, scale = 2, nullable = false)
    private BigDecimal total = BigDecimal.ZERO;

    @Column(name = "platform_fee", precision = 15, scale = 2, nullable = false)
    private BigDecimal platformFee = BigDecimal.ZERO;

    @Column(name = "seller_income", precision = 15, scale = 2, nullable = false)
    private BigDecimal sellerIncome = BigDecimal.ZERO;

    @Column(name = "shipper_fee", precision = 15, scale = 2, nullable = false)
    private BigDecimal shipperFee = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 20, nullable = false)
    private PaymentMethod paymentMethod = PaymentMethod.COD;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", length = 20, nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private OrderStatus status;

    @Column(name = "note", length = 500)
    private String note;

    @Column(name = "cancel_reason", length = 500)
    private String cancelReason;

    /** Source of the cancellation (BUYER, SELLER, ADMIN, SYSTEM). */
    @Column(name = "cancelled_by", length = 20)
    private String cancelledBy;

    @Column(name = "shipper_username", length = 50)
    private String shipperUsername;

    @Column(name = "failed_attempts", nullable = false)
    private int failedAttempts;

    @Column(name = "delivery_proof_url", length = 500)
    private String deliveryProofUrl;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @Column(name = "shipped_at")
    private LocalDateTime shippedAt;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "store_voucher_id")
    private UUID storeVoucherId;

    @Column(name = "platform_voucher_id")
    private UUID platformVoucherId;

    /** Shipper carrying the goods back after an approved buyer return (the delivery shipper is {@code shipperUsername}). */
    @Column(name = "return_shipper_username", length = 50)
    private String returnShipperUsername;

    @Column(name = "refunded_at")
    private LocalDateTime refundedAt;
}
