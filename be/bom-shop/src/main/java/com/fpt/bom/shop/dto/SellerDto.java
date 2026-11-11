package com.fpt.bom.shop.dto;

import com.fpt.bom.shop.dto.CatalogDto.VariantResponse;
import com.fpt.bom.shop.enums.ArType;
import com.fpt.bom.shop.enums.ProductStatus;
import com.fpt.core.common.dto.PagingBase;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.fpt.core.common.constant.Constants;

/** Seller Center product and store shapes. */
public final class SellerDto {

    private SellerDto() {
    }

    public record StoreUpdateRequest(
            @NotBlank(message = "{shop.validation.required}") @Size(max = 200, message = "{shop.validation.size}")
            String name,
            @Size(max = 4000, message = "{shop.validation.size}") String description,
            @Size(max = 500, message = "{shop.validation.size}") String logoUrl,
            @Size(max = 500, message = "{shop.validation.size}") String bannerUrl,
            @NotBlank(message = "{shop.validation.phone}")
            @Pattern(regexp = Constants.REGEX.PHONE, message = "{shop.validation.phone}")
            @Size(max = 30, message = "{shop.validation.phone}")
            String phone,
            @NotBlank(message = "{shop.validation.required}") @Size(max = 500, message = "{shop.validation.size}")
            String address,
            @NotBlank(message = "{shop.validation.required}") @Size(max = 100, message = "{shop.validation.size}")
            String province) {
    }

    public record VariantRequest(
            UUID id,
            @NotBlank(message = "{shop.validation.required}") @Size(max = 200, message = "{shop.validation.size}")
            String name,
            @NotNull(message = "{shop.validation.amount}")
            @DecimalMin(value = "0", message = "{shop.validation.amount}") BigDecimal price,
            @Min(value = 0, message = "{shop.validation.amount}") int stock,
            @Size(max = 100, message = "{shop.validation.size}") String sku) {
    }

    public record ProductRequest(
            UUID id,
            @NotNull(message = "{shop.validation.required}") UUID categoryId,
            @NotBlank(message = "{shop.validation.required}") @Size(max = 300, message = "{shop.validation.size}")
            String name,
            @Size(max = 10000, message = "{shop.validation.size}") String description,
            @NotNull(message = "{shop.validation.amount}")
            @DecimalMin(value = "0", message = "{shop.validation.amount}") BigDecimal price,
            @DecimalMin(value = "0", message = "{shop.validation.amount}") BigDecimal originalPrice,
            @Min(value = 0, message = "{shop.validation.amount}") int stock,
            @NotEmpty(message = "{shop.validation.images}") @Size(max = 10, message = "{shop.validation.images}")
            List<@NotBlank(message = "{shop.validation.images}")
            @Size(max = 500, message = "{shop.validation.size}") String> images,
            @Valid List<VariantRequest> variants,
            @Size(max = 20, message = "{shop.validation.size}") List<@Size(max = 50, message = "{shop.validation.size}") String> tags,
            @NotNull(message = "{shop.validation.required}") ProductStatus status,
            ArType arType,
            @Size(max = 500, message = "{shop.validation.size}") String arOverlayUrl,
            @DecimalMin(value = "0.1", message = "{shop.validation.arScale}")
            @DecimalMax(value = "5", message = "{shop.validation.arScale}") Double arScale,
            @DecimalMin(value = "-1", message = "{shop.validation.arScale}")
            @DecimalMax(value = "1", message = "{shop.validation.arScale}") Double arOffsetY) {
    }

    /** Seller / admin view of a product; {@code storeName} and {@code banReason} are for the admin listing too. */
    public record ProductResponse(UUID id, UUID storeId, String storeName, UUID categoryId, String categoryName,
            String name, String slug, String description, BigDecimal price, BigDecimal originalPrice, int stock,
            int soldCount, long viewCount, double ratingAvg, int ratingCount, String thumbnailUrl,
            List<String> images, List<VariantResponse> variants, List<String> tags, ProductStatus status,
            String banReason, ArType arType, String arOverlayUrl, double arScale, double arOffsetY,
            LocalDateTime createdDate) {
    }

    public record ReviewReplyRequest(
            @NotNull(message = "{common.id.notNull}") UUID id,
            @NotBlank(message = "{shop.validation.required}") @Size(max = 2000, message = "{shop.validation.size}")
            String reply) {
    }

    @Getter
    @Setter
    public static class ProductFilter extends PagingBase {
        private String keyword;
        private ProductStatus status;
        private UUID categoryId;
        /** Admin listing only. */
        private UUID storeId;
    }
}
