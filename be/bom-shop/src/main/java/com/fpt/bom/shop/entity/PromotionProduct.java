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
@Table(name = "shop_promotion_product")
public class PromotionProduct extends ShopEntity {

    @Column(name = "promotion_id", nullable = false)
    private UUID promotionId;

    @Column(name = "product_id", nullable = false)
    private UUID productId;
}
