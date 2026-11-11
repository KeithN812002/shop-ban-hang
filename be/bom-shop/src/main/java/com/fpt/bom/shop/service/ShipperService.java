package com.fpt.bom.shop.service;

import com.fpt.bom.shop.dto.AccountDto.ShipperRegisterRequest;
import com.fpt.bom.shop.dto.AccountDto.ShipperResponse;
import com.fpt.bom.shop.dto.AdminDto.ApprovalFilter;
import com.fpt.bom.shop.dto.CommonDto.ReasonRequest;
import com.fpt.core.common.dto.PageResult;

public interface ShipperService {

    /** Registers (or re-submits after a rejection) the caller as a shipper; it starts PENDING. */
    void register(ShipperRegisterRequest request);

    /** The caller's shipper row, whatever its status. */
    ShipperResponse profile();

    PageResult<ShipperResponse> adminSearch(ApprovalFilter filter);

    void approve(ReasonRequest request);

    void reject(ReasonRequest request);

    void suspend(ReasonRequest request);

    void reactivate(ReasonRequest request);
}
