package com.fpt.bom.shop.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "shop_product_image")
public class ProductImage extends ShopEntity {

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "url", length = 500, nullable = false)
    private String url;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;
}
