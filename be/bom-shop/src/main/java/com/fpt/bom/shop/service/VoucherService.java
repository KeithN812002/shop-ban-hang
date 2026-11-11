package com.fpt.bom.shop.service;

import com.fpt.bom.shop.dto.VoucherDto.VoucherFilter;
import com.fpt.bom.shop.dto.VoucherDto.VoucherRequest;
import com.fpt.bom.shop.dto.VoucherDto.VoucherResponse;
import com.fpt.core.common.dto.PageResult;

import java.util.List;
import java.util.UUID;

/**
 * Voucher catalogue. Management methods take {@code seller}: true resolves the caller's own store so a seller
 * can only ever touch its own vouchers and an admin only the platform ones.
 */
public interface VoucherService {

    /** Vouchers the caller can use now: platform ones plus those of {@code storeId} when given. */
    List<VoucherResponse> available(UUID storeId);

    PageResult<VoucherResponse> search(boolean seller, VoucherFilter filter);

    VoucherResponse create(boolean seller, VoucherRequest request);

    VoucherResponse update(boolean seller, VoucherRequest request);

    /** Hard-deletes an unused voucher; a voucher that was already used is deactivated instead. */
    void delete(boolean seller, UUID id);
}
