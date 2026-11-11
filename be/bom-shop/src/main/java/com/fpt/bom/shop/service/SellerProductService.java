package com.fpt.bom.shop.service;

import com.fpt.bom.shop.dto.AdminDto.AdminProductResponse;
import com.fpt.bom.shop.dto.SellerDto.ProductFilter;
import com.fpt.bom.shop.dto.SellerDto.ProductRequest;
import com.fpt.bom.shop.dto.SellerDto.ProductResponse;
import com.fpt.core.common.dto.PageResult;

import java.util.List;
import java.util.UUID;

/** Product management of the caller's own ACTIVE store. */
public interface SellerProductService {

    PageResult<AdminProductResponse> search(ProductFilter filter);

    ProductResponse view(UUID id);

    ProductResponse create(ProductRequest request);

    ProductResponse update(ProductRequest request);

    /** Soft-deletes the given products (all must belong to the caller's store). */
    void delete(List<UUID> ids);
}
