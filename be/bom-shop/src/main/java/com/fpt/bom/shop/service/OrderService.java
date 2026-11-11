package com.fpt.bom.shop.service;

import com.fpt.bom.shop.dto.OrderDto.CancelRequest;
import com.fpt.bom.shop.dto.OrderDto.CheckoutRequest;
import com.fpt.bom.shop.dto.OrderDto.OrderCreateResponse;
import com.fpt.bom.shop.dto.OrderDto.OrderDetailResponse;
import com.fpt.bom.shop.dto.OrderDto.OrderFilter;
import com.fpt.bom.shop.dto.OrderDto.OrderPreviewResponse;
import com.fpt.bom.shop.dto.OrderDto.OrderResponse;
import com.fpt.bom.shop.dto.ReturnDto.ReturnCreateRequest;
import com.fpt.bom.shop.dto.ReturnDto.ReturnDisputeRequest;
import com.fpt.bom.shop.dto.ReturnDto.ReturnWithdrawRequest;
import com.fpt.core.common.dto.PageResult;

import java.util.UUID;

/** Buyer side of orders: checkout, history, cancel and receipt confirmation. */
public interface OrderService {

    OrderPreviewResponse preview(CheckoutRequest request);

    /** One order per store in a single transaction; stock is decremented atomically. */
    OrderCreateResponse create(CheckoutRequest request);

    PageResult<OrderResponse> search(OrderFilter filter);

    OrderDetailResponse detail(UUID id);

    void cancel(CancelRequest request);

    void confirmReceived(UUID id);

    /** DELIVERED -> RETURN_REQUESTED inside the return window (whole-order return with bank details for the refund). */
    void requestReturn(ReturnCreateRequest request);

    /** The buyer contests a seller rejection within the dispute window; an admin decides. */
    void disputeReturn(ReturnDisputeRequest request);

    /** Withdraws a REQUESTED or REJECTED return; the order completes normally. */
    void withdrawReturn(ReturnWithdrawRequest request);
}
