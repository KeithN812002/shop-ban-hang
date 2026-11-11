package com.fpt.bom.shop.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "shop_review")
public class Review extends ShopEntity {

    @Column(name = "order_item_id", nullable = false, unique = true)
    private UUID orderItemId;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "store_id", nullable = false)
    private UUID storeId;

    @Column(name = "buyer_username", length = 50, nullable = false)
    private String buyerUsername;

    @Column(name = "rating", nullable = false)
    private int rating;

    @Column(name = "comment", length = 2000)
    private String comment;

    @Column(name = "image_urls", length = 2000)
    private String imageUrls;

    @Column(name = "seller_reply", length = 2000)
    private String sellerReply;

    @Column(name = "replied_at")
    private LocalDateTime repliedAt;
}
