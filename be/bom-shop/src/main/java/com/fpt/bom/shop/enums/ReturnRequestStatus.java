package com.fpt.bom.shop.enums;

/** Progress of a buyer return request (the order status tells the physical progress once APPROVED). */
public enum ReturnRequestStatus {
    REQUESTED, APPROVED, REJECTED, DISPUTED, CANCELLED, CLOSED
}
