package com.fpt.bom.shop.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "shop_wishlist", uniqueConstraints = @UniqueConstraint(name = "uk_shop_wishlist",
        columnNames = {"username", "product_id"}))
public class Wishlist extends ShopEntity {

    @Column(name = "username", length = 50, nullable = false)
    private String username;

    @Column(name = "product_id", nullable = false)
    private UUID productId;
}
