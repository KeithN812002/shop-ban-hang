package com.fpt.bom.shop.entity;

import com.fpt.bom.shop.enums.NotificationType;
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
@Table(name = "shop_notification")
public class Notification extends ShopEntity {

    @Column(name = "username", length = 50, nullable = false)
    private String username;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 20, nullable = false)
    private NotificationType type;

    @Column(name = "title", length = 300, nullable = false)
    private String title;

    @Column(name = "content", length = 1000)
    private String content;

    @Column(name = "link", length = 500)
    private String link;

    @Column(name = "is_read", nullable = false)
    private boolean read;
}
