package com.fpt.bom.shop.entity;

import com.fpt.bom.shop.enums.SenderRole;
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
@Table(name = "shop_message")
public class Message extends ShopEntity {

    @Column(name = "conversation_id", nullable = false)
    private UUID conversationId;

    @Column(name = "sender_username", length = 50, nullable = false)
    private String senderUsername;

    @Enumerated(EnumType.STRING)
    @Column(name = "sender_role", length = 10, nullable = false)
    private SenderRole senderRole;

    @Column(name = "content", length = 2000, nullable = false)
    private String content;

    @Column(name = "product_id")
    private UUID productId;
}
