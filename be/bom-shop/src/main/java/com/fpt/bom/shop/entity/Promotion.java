package com.fpt.bom.shop.entity;

import com.fpt.core.common.enums.StatusBasic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/** A time-boxed percentage discount a store puts on chosen products. */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "shop_promotion")
public class Promotion extends ShopSoftDeleteEntity {

    @Column(name = "store_id", nullable = false)
    private UUID storeId;

    @Column(name = "name", length = 150, nullable = false)
    private String name;

    @Column(name = "discount_percent", nullable = false)
    private int discountPercent;

    @Column(name = "start_at", nullable = false)
    private LocalDateTime startAt;

    @Column(name = "end_at", nullable = false)
    private LocalDateTime endAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private StatusBasic status;
}
