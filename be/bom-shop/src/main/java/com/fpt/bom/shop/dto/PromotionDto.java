package com.fpt.bom.shop.dto;

import com.fpt.bom.shop.enums.ProductStatus;
import com.fpt.bom.shop.enums.PromotionState;
import com.fpt.core.common.dto.PagingBase;
import com.fpt.core.common.enums.StatusBasic;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public final class PromotionDto {

    private PromotionDto() {
    }

    public record PromotionRequest(
            UUID id,
            @NotBlank(message = "{shop.validation.required}") @Size(max = 150, message = "{shop.validation.size}")
            String name,
            @Min(value = 1, message = "{shop.promotion.percentRange}")
            @Max(value = 90, message = "{shop.promotion.percentRange}") int discountPercent,
            @NotNull(message = "{shop.validation.required}") LocalDateTime startAt,
            @NotNull(message = "{shop.validation.required}") LocalDateTime endAt,
            StatusBasic status,
            @NotEmpty(message = "{shop.promotion.productsRequired}")
            @Size(max = 200, message = "{shop.promotion.productsRequired}")
            List<@NotNull(message = "{shop.promotion.productsRequired}") UUID> productIds) {
    }

    /** A product of a promotion with the price it sells at while the promotion runs. */
    public record SellerProductRow(UUID id, String name, String thumbnailUrl, BigDecimal price,
            BigDecimal effectivePrice, int stock, ProductStatus status) {
    }

    /** {@code products} is only filled by the detail endpoint. */
    public record PromotionResponse(UUID id, String name, int discountPercent, LocalDateTime startAt,
            LocalDateTime endAt, StatusBasic status, PromotionState state, int productCount,
            List<SellerProductRow> products, LocalDateTime createdDate) {
    }

    @Getter
    @Setter
    public static class PromotionFilter extends PagingBase {
        private String keyword;
        private PromotionState state;
    }
}
