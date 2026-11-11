package com.fpt.bom.shop.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "shop_conversation", uniqueConstraints = @UniqueConstraint(name = "uk_shop_conversation",
        columnNames = {"buyer_username", "store_id"}))
public class Conversation extends ShopEntity {

    @Column(name = "buyer_username", length = 50, nullable = false)
    private String buyerUsername;

    @Column(name = "store_id", nullable = false)
    private UUID storeId;

    @Column(name = "last_message", length = 1000)
    private String lastMessage;

    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;

    @Column(name = "buyer_unread", nullable = false)
    private int buyerUnread;

    @Column(name = "seller_unread", nullable = false)
    private int sellerUnread;
}
