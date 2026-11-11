package com.fpt.bom.shop.service;

import com.fpt.bom.shop.dto.AdminDto.AdminProductResponse;
import com.fpt.bom.shop.dto.CommonDto.ReasonRequest;
import com.fpt.bom.shop.dto.SellerDto.ProductFilter;
import com.fpt.bom.shop.dto.SellerDto.ProductResponse;
import com.fpt.core.common.dto.PageResult;

import java.util.UUID;

public interface AdminProductService {

    PageResult<AdminProductResponse> search(ProductFilter filter);

    ProductResponse view(UUID id);

    /** Bans an ACTIVE/HIDDEN/DRAFT product; it disappears from the storefront and the seller cannot edit it. */
    void ban(ReasonRequest request);

    /** Lifts a ban; the product returns as HIDDEN and the seller republishes it. */
    void unban(ReasonRequest request);
}
