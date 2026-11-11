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
@Table(name = "shop_voucher_usage")
public class VoucherUsage extends ShopEntity {

    @Column(name = "voucher_id", nullable = false)
    private UUID voucherId;

    @Column(name = "username", length = 50, nullable = false)
    private String username;

    @Column(name = "order_id", nullable = false)
    private UUID orderId;
}
