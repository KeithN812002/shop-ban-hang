package com.fpt.bom.shop.entity;

import com.fpt.bom.shop.enums.ApprovalStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "shop_store")
public class Store extends ShopSoftDeleteEntity {

    @Column(name = "owner_username", length = 50, nullable = false, unique = true)
    private String ownerUsername;

    @Column(name = "name", length = 200, nullable = false)
    private String name;

    @Column(name = "slug", length = 220, nullable = false, unique = true)
    private String slug;

    @Column(name = "description", length = 4000)
    private String description;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "banner_url", length = 500)
    private String bannerUrl;

    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "province", length = 100)
    private String province;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private ApprovalStatus status;

    @Column(name = "reject_reason", length = 500)
    private String rejectReason;

    @Column(name = "rating_avg", nullable = false)
    private double ratingAvg;

    @Column(name = "rating_count", nullable = false)
    private int ratingCount;

    @Column(name = "product_count", nullable = false)
    private int productCount;

    @Column(name = "follower_count", nullable = false)
    private int followerCount;
}
