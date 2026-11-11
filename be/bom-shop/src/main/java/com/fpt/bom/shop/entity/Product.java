package com.fpt.bom.shop.entity;

import com.fpt.bom.shop.enums.ArType;
import com.fpt.bom.shop.enums.ProductStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "shop_product")
public class Product extends ShopSoftDeleteEntity {

    @Column(name = "store_id", nullable = false)
    private UUID storeId;

    @Column(name = "category_id")
    private UUID categoryId;

    @Column(name = "name", length = 300, nullable = false)
    private String name;

    @Column(name = "slug", length = 350, nullable = false)
    private String slug;

    @Column(name = "description", length = 10000)
    private String description;

    @Column(name = "price", precision = 15, scale = 2, nullable = false)
    private BigDecimal price;

    @Column(name = "original_price", precision = 15, scale = 2)
    private BigDecimal originalPrice;

    @Column(name = "stock", nullable = false)
    private int stock;

    @Column(name = "sold_count", nullable = false)
    private int soldCount;

    @Column(name = "view_count", nullable = false)
    private long viewCount;

    @Column(name = "rating_avg", nullable = false)
    private double ratingAvg;

    @Column(name = "rating_count", nullable = false)
    private int ratingCount;

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Column(name = "tags", length = 500)
    private String tags;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private ProductStatus status;

    @Column(name = "ban_reason", length = 500)
    private String banReason;

    @Enumerated(EnumType.STRING)
    @Column(name = "ar_type", length = 30, nullable = false)
    private ArType arType = ArType.NONE;

    @Column(name = "ar_overlay_url", length = 500)
    private String arOverlayUrl;

    @Column(name = "ar_scale", nullable = false)
    private double arScale = 1.0;

    @Column(name = "ar_offset_y", nullable = false)
    private double arOffsetY = 0.0;
}
