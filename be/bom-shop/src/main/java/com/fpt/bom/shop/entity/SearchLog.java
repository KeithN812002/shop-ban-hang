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
@Table(name = "shop_search_log")
public class SearchLog extends ShopEntity {

    @Column(name = "keyword", length = 200, nullable = false)
    private String keyword;

    @Column(name = "username", length = 50)
    private String username;
}
