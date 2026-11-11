package com.fpt.bom.shop.entity;

import com.fpt.bom.shop.enums.ReturnReason;
import com.fpt.bom.shop.enums.ReturnRequestStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/** A buyer's whole-order return/refund request; at most one per order. */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "shop_return_request")
public class ReturnRequest extends ShopEntity {

    @Column(name = "order_id", nullable = false, unique = true)
    private UUID orderId;

    @Column(name = "buyer_username", length = 50, nullable = false)
    private String buyerUsername;

    @Enumerated(EnumType.STRING)
    @Column(name = "reason_code", length = 30, nullable = false)
    private ReturnReason reasonCode;

    @Column(name = "description", length = 1000)
    private String description;

    /** Comma-separated image URLs (1..6). */
    @Column(name = "image_urls", nullable = false, columnDefinition = "text")
    private String imageUrls;

    @Column(name = "bank_name", length = 100, nullable = false)
    private String bankName;

    @Column(name = "bank_account_no", length = 30, nullable = false)
    private String bankAccountNo;

    @Column(name = "bank_account_name", length = 100, nullable = false)
    private String bankAccountName;

    @Column(name = "refund_amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal refundAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private ReturnRequestStatus status;

    /** Reject reason or approve note of the seller. */
    @Column(name = "seller_note", length = 500)
    private String sellerNote;

    @Column(name = "dispute_reason", length = 500)
    private String disputeReason;

    @Column(name = "admin_note", length = 500)
    private String adminNote;

    @Column(name = "refund_proof_url", length = 500)
    private String refundProofUrl;

    @Column(name = "refund_note", length = 500)
    private String refundNote;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @Column(name = "disputed_at")
    private LocalDateTime disputedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "refunded_at")
    private LocalDateTime refundedAt;

    @Column(name = "refunded_by", length = 50)
    private String refundedBy;
}
