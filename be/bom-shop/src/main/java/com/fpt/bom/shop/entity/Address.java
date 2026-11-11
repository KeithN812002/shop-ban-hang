package com.fpt.bom.shop.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "shop_address")
public class Address extends ShopEntity {

    @Column(name = "username", length = 50, nullable = false)
    private String username;

    @Column(name = "receiver_name", length = 200, nullable = false)
    private String receiverName;

    @Column(name = "phone", length = 30, nullable = false)
    private String phone;

    @Column(name = "province", length = 100, nullable = false)
    private String province;

    @Column(name = "district", length = 100)
    private String district;

    @Column(name = "ward", length = 100)
    private String ward;

    @Column(name = "detail", length = 500, nullable = false)
    private String detail;

    @Column(name = "is_default", nullable = false)
    private boolean defaultAddress;
}
