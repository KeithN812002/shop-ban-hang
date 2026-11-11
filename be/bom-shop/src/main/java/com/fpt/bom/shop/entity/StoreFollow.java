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
@Table(name = "shop_store_follow", uniqueConstraints = @UniqueConstraint(name = "uk_shop_store_follow",
        columnNames = {"store_id", "username"}))
public class StoreFollow extends ShopEntity {

    @Column(name = "store_id", nullable = false)
    private UUID storeId;

    @Column(name = "username", length = 50, nullable = false)
    private String username;
}
