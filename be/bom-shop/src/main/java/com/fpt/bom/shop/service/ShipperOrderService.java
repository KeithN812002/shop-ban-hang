package com.fpt.bom.shop.service;

import com.fpt.bom.shop.dto.CommonDto.ReasonRequest;
import com.fpt.bom.shop.dto.OrderDto.DeliveredRequest;
import com.fpt.bom.shop.dto.OrderDto.OrderDetailResponse;
import com.fpt.bom.shop.dto.OrderDto.OrderFilter;
import com.fpt.bom.shop.dto.OrderDto.OrderResponse;
import com.fpt.core.common.dto.PageResult;

import java.util.UUID;

/** Delivery work of an ACTIVE shipper. */
public interface ShipperOrderService {

    /** READY_TO_SHIP orders nobody took yet, filtered by province (defaults to the shipper's area). */
    PageResult<OrderResponse> available(OrderFilter filter);

    /** Orders assigned to the caller (PICKING, SHIPPING, RETURNING, DELIVERED, RETURNED unless a status is given). */
    PageResult<OrderResponse> mine(OrderFilter filter);

    /** Only when the order is assigned to the caller or still available. */
    OrderDetailResponse detail(UUID id);

    /** READY_TO_SHIP -> PICKING; exactly one of several concurrent shippers wins. */
    void accept(UUID id);

    /** PICKING -> SHIPPING. */
    void pickedUp(UUID id);

    /** SHIPPING -> DELIVERED with proof; COD is marked collected. */
    void delivered(DeliveredRequest request);

    /** A failed attempt; the third failure sends the order back (RETURNING); stock is restored when the seller confirms the return. */
    void failed(ReasonRequest request);
}
