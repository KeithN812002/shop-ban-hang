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

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "shop_category")
public class Category extends ShopEntity {

    @Column(name = "name", length = 200, nullable = false)
    private String name;

    @Column(name = "slug", length = 220, nullable = false, unique = true)
    private String slug;

    @Column(name = "parent_id")
    private UUID parentId;

    @Column(name = "icon", length = 100)
    private String icon;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private StatusBasic status;
}
