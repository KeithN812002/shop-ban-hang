package com.fpt.bom.shop.service;

import com.fpt.bom.shop.dto.CommonDto.ReasonRequest;
import com.fpt.bom.shop.dto.OrderDto.OrderDetailResponse;
import com.fpt.bom.shop.dto.OrderDto.OrderFilter;
import com.fpt.bom.shop.dto.OrderDto.OrderResponse;
import com.fpt.bom.shop.dto.ReturnDto.RefundRequest;
import com.fpt.bom.shop.dto.ReturnDto.ReturnResolveRequest;
import com.fpt.core.common.dto.PageResult;
import com.fpt.core.common.dto.UUIDRequest;

import java.util.UUID;

public interface AdminOrderService {

    PageResult<OrderResponse> search(OrderFilter filter);

    OrderDetailResponse detail(UUID id);

    /** PENDING|CONFIRMED -> CANCELLED on behalf of the platform; a reason is required. */
    void cancel(ReasonRequest request);

    /** RETURNING -> RETURNED on behalf of the store; restores stock. */
    void confirmReturned(UUIDRequest request);

    /** Decides a DISPUTED return: approve (RETURN_APPROVED) or reject (order COMPLETED); a note is required. */
    void resolveReturn(ReturnResolveRequest request);

    /** RETURN_RECEIVED -> REFUNDED on behalf of the store. */
    void markRefunded(RefundRequest request);
}
