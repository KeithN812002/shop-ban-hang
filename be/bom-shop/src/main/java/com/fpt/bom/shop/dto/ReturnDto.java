package com.fpt.bom.shop.dto;

import com.fpt.bom.shop.enums.ReturnReason;
import com.fpt.bom.shop.enums.ReturnRequestStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** Buyer return / refund request shapes (docs/shop-contract.md section 12). */
public final class ReturnDto {

    private ReturnDto() {
    }

    /** Free-form fields are length-checked here; images and bank details are validated by {@code ReturnRules}. */
    public record ReturnCreateRequest(
            @NotNull(message = "{common.id.notNull}") UUID orderId,
            @NotNull(message = "{shop.return.reasonRequired}") ReturnReason reasonCode,
            @Size(max = 1000, message = "{shop.validation.size}") String description,
            List<String> imageUrls,
            String bankName,
            String bankAccountNo,
            String bankAccountName) {
    }

    public record ReturnDisputeRequest(
            @NotNull(message = "{common.id.notNull}") UUID orderId,
            @Size(max = 500, message = "{shop.validation.reason}") String reason) {
    }

    public record ReturnWithdrawRequest(@NotNull(message = "{common.id.notNull}") UUID orderId) {
    }

    /** Seller approve ({@code note} optional). */
    public record ReturnApproveRequest(
            @NotNull(message = "{common.id.notNull}") UUID id,
            @Size(max = 500, message = "{shop.validation.size}") String note) {
    }

    /** Admin decision on a disputed request. */
    public record ReturnResolveRequest(
            @NotNull(message = "{common.id.notNull}") UUID id,
            @NotNull(message = "{shop.validation.required}") Boolean approve,
            @Size(max = 500, message = "{shop.validation.size}") String note) {
    }

    /** Seller/admin records that the bank transfer was made. */
    public record RefundRequest(
            @NotNull(message = "{common.id.notNull}") UUID id,
            @Size(max = 500, message = "{shop.validation.size}") String proofImageUrl,
            @Size(max = 500, message = "{shop.validation.size}") String note) {
    }

    /**
     * Bank fields are {@code null} for the shipper view. {@code responseDeadline} is only set while the seller has
     * not answered, {@code disputeDeadline} only while the request is REJECTED and can still be disputed.
     */
    public record ReturnRequestResponse(UUID id, ReturnReason reasonCode, String description,
            List<String> imageUrls, String bankName, String bankAccountNo, String bankAccountName,
            BigDecimal refundAmount, ReturnRequestStatus status, String sellerNote, String disputeReason,
            String adminNote, String refundProofUrl, String refundNote, LocalDateTime requestedAt,
            LocalDateTime respondedAt, LocalDateTime disputedAt, LocalDateTime resolvedAt,
            LocalDateTime refundedAt, LocalDateTime responseDeadline, LocalDateTime disputeDeadline) {
    }
}
