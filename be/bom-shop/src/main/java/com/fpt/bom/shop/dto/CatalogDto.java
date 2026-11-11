package com.fpt.bom.shop.dto;

import com.fpt.bom.shop.enums.ArType;
import com.fpt.core.common.dto.PagingBase;
import com.fpt.core.common.enums.StatusBasic;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Public catalogue shapes: categories, products, stores, reviews, home. */
public final class CatalogDto {

    private CatalogDto() {
    }

    /** Public tree node; {@code parentId}, {@code sortOrder} and {@code status} are filled for admin use. */
    public record CategoryNode(UUID id, String name, String slug, String icon, String imageUrl, UUID parentId,
            int sortOrder, StatusBasic status, List<CategoryNode> children) {
    }

    public record CategoryRequest(
            UUID id,
            @NotBlank(message = "{shop.validation.required}") @Size(max = 200, message = "{shop.validation.size}")
            String name,
            UUID parentId,
            @Size(max = 100, message = "{shop.validation.size}") String icon,
            @Size(max = 500, message = "{shop.validation.size}") String imageUrl,
            Integer sortOrder,
            StatusBasic status) {
    }

    /**
     * While a shop promotion runs, {@code price} is the effective price, {@code originalPrice} the base price,
     * {@code discountPercent} the promotion percent and {@code promotionName}/{@code promotionEndAt} are set;
     * otherwise both promotion fields are null.
     */
    public record ProductCard(UUID id, String name, String slug, String thumbnailUrl, BigDecimal price,
            BigDecimal originalPrice, int discountPercent, double ratingAvg, int ratingCount, int soldCount,
            UUID storeId, String storeName, String province, ArType arType, String promotionName,
            LocalDateTime promotionEndAt) {
    }

    public record VariantResponse(UUID id, String name, BigDecimal price, int stock, String sku) {
    }

    public record StoreResponse(UUID id, String name, String slug, String description, String logoUrl,
            String bannerUrl, String province, double ratingAvg, int ratingCount, int productCount,
            int followerCount, LocalDateTime createdDate) {
    }

    public record ProductDetail(UUID id, String name, String slug, String thumbnailUrl, BigDecimal price,
            BigDecimal originalPrice, int discountPercent, double ratingAvg, int ratingCount, int soldCount,
            UUID storeId, String storeName, String province, ArType arType, String description, int stock,
            UUID categoryId, String categoryName, List<String> images, List<VariantResponse> variants,
            List<String> tags, String arOverlayUrl, double arScale, double arOffsetY, StoreResponse store,
            String promotionName, LocalDateTime promotionEndAt) {
    }

    /** Review; the product/reply-time fields are only filled in the seller listing. */
    public record ReviewResponse(UUID id, String buyerName, int rating, String comment, List<String> imageUrls,
            String variantName, String sellerReply, LocalDateTime createdDate, UUID productId,
            String productName, LocalDateTime repliedAt) {
    }

    public record ReviewSummary(double average, long total, Map<Integer, Long> counts) {
    }

    public record HomeResponse(List<CategoryNode> categories, List<ProductCard> trending,
            List<ProductCard> bestSellers, List<ProductCard> newArrivals, List<ProductCard> flashDeals,
            List<String> trendingKeywords) {
    }

    @Getter
    @Setter
    public static class ProductSearchFilter extends PagingBase {
        private String keyword;
        private UUID categoryId;
        private UUID storeId;
        private BigDecimal minPrice;
        private BigDecimal maxPrice;
        private Double minRating;
        /** relevance | newest | price_asc | price_desc | best_selling | popular */
        private String sort;
    }

    @Getter
    @Setter
    public static class ReviewFilter extends PagingBase {
        private Integer rating;
        /** Seller listing only: true = replied, false = awaiting reply. */
        private Boolean replied;
    }
}
