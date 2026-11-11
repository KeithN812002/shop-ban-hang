package com.fpt.bom.shop.service;

import com.fpt.bom.shop.dto.CommonDto.ReasonRequest;
import com.fpt.bom.shop.dto.OrderDto.OrderDetailResponse;
import com.fpt.bom.shop.dto.OrderDto.OrderFilter;
import com.fpt.bom.shop.dto.OrderDto.OrderResponse;
import com.fpt.bom.shop.dto.ReturnDto.RefundRequest;
import com.fpt.bom.shop.dto.ReturnDto.ReturnApproveRequest;
import com.fpt.core.common.dto.PageResult;
import com.fpt.core.common.dto.UUIDRequest;

import java.util.UUID;

/** Order handling of the caller's own ACTIVE store. */
public interface SellerOrderService {

    PageResult<OrderResponse> search(OrderFilter filter);

    OrderDetailResponse detail(UUID id);

    /** PENDING -> CONFIRMED. */
    void confirm(ReasonRequest request);

    /** CONFIRMED -> READY_TO_SHIP (becomes visible to shippers). */
    void readyToShip(ReasonRequest request);

    /** PENDING|CONFIRMED -> CANCELLED; a reason is required. */
    void cancel(ReasonRequest request);

    /** RETURNING -> RETURNED once the goods are back at the store; restores stock. */
    void confirmReturned(UUIDRequest request);

    /** RETURN_REQUESTED (REQUESTED) -> RETURN_APPROVED; the goods are then collected from the buyer by a shipper. */
    void approveReturn(ReturnApproveRequest request);

    /** Rejects a REQUESTED return; a reason is required. The buyer may dispute within the dispute window. */
    void rejectReturn(ReasonRequest request);

    /** RETURN_SHIPPING -> RETURN_RECEIVED once the returned goods arrive; restores stock. */
    void confirmReturnReceived(UUIDRequest request);

    /** RETURN_RECEIVED -> REFUNDED after the manual bank transfer to the buyer. */
    void markRefunded(RefundRequest request);
}
