package com.fpt.bom.shop.entity;

import com.fpt.bom.shop.enums.ActorSource;
import com.fpt.bom.shop.enums.OrderStatus;
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
@Table(name = "shop_order_history")
public class OrderHistory extends ShopEntity {

    @Column(name = "order_id", nullable = false)
    private UUID orderId;

    @Column(name = "action", length = 50, nullable = false)
    private String action;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_before", length = 20)
    private OrderStatus statusBefore;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_after", length = 20, nullable = false)
    private OrderStatus statusAfter;

    @Column(name = "actor", length = 50, nullable = false)
    private String actor;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", length = 20, nullable = false)
    private ActorSource source;

    @Column(name = "note", length = 500)
    private String note;
}
