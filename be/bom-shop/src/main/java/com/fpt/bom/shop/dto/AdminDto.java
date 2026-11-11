package com.fpt.bom.shop.dto;

import com.fpt.bom.shop.enums.ApprovalStatus;
import com.fpt.bom.shop.enums.ArType;
import com.fpt.bom.shop.enums.ProductStatus;
import java.util.List;
import com.fpt.core.common.dto.PagingBase;
import com.fpt.core.common.enums.StatusBasic;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/** Admin-only listings. */
public final class AdminDto {

    private AdminDto() {
    }

    public record AdminStoreResponse(UUID id, String ownerUsername, String name, String slug, String description,
            String logoUrl, String bannerUrl, String phone, String address, String province,
            ApprovalStatus status, String rejectReason, double ratingAvg, int ratingCount, int productCount,
            int followerCount, LocalDateTime createdDate) {
    }

    /** {@code userId} is the sa_user id used by sa/external-user lock/unlock; roles are BUYER|SELLER|SHIPPER. */
    public record AccountResponse(UUID userId, String username, String fullName, String email, String phone,
            List<String> roles, StatusBasic status, long orderCount, BigDecimal totalSpent, UUID storeId,
            String storeName, ApprovalStatus storeStatus, UUID shipperId, ApprovalStatus shipperStatus,
            LocalDateTime createdDate) {
    }

    /** Admin product list row: product card plus moderation fields. */
    public record AdminProductResponse(UUID id, String name, String slug, String thumbnailUrl, BigDecimal price,
            BigDecimal originalPrice, int discountPercent, double ratingAvg, int ratingCount, int soldCount,
            UUID storeId, String storeName, String province, ArType arType, ProductStatus status,
            String banReason, int stock, LocalDateTime createdDate) {
    }

    @Getter
    @Setter
    public static class ApprovalFilter extends PagingBase {
        private String keyword;
        private ApprovalStatus status;
    }

    @Getter
    @Setter
    public static class AccountFilter extends PagingBase {
        private String keyword;
        /** BUYER | SELLER | SHIPPER */
        private String role;
        private StatusBasic status;
    }
}
