package com.fpt.bom.shop.service;

import com.fpt.bom.shop.dto.AccountDto.FollowRequest;
import com.fpt.bom.shop.dto.AccountDto.FollowResponse;
import com.fpt.bom.shop.dto.AccountDto.StoreRegisterRequest;
import com.fpt.bom.shop.dto.AdminDto.AdminStoreResponse;
import com.fpt.bom.shop.dto.AdminDto.ApprovalFilter;
import com.fpt.bom.shop.dto.CatalogDto.StoreResponse;
import com.fpt.bom.shop.dto.CommonDto.ReasonRequest;
import com.fpt.bom.shop.dto.SellerDto.StoreUpdateRequest;
import com.fpt.core.common.dto.PageResult;

import java.util.UUID;

public interface StoreService {

    // ---- public / buyer ----

    StoreResponse publicStore(UUID id);

    /** Registers (or re-submits after a rejection) a store owned by the caller; it starts PENDING. */
    void register(StoreRegisterRequest request);

    FollowResponse toggleFollow(FollowRequest request);

    FollowResponse followStatus(UUID storeId);

    /** Stores the caller follows (only those still ACTIVE), most recently followed first. */
    java.util.List<StoreResponse> followedStores();

    // ---- seller ----

    AdminStoreResponse sellerStore();

    void sellerUpdate(StoreUpdateRequest request);

    // ---- admin ----

    PageResult<AdminStoreResponse> adminSearch(ApprovalFilter filter);

    AdminStoreResponse adminView(UUID id);

    void approve(ReasonRequest request);

    void reject(ReasonRequest request);

    void suspend(ReasonRequest request);

    void reactivate(ReasonRequest request);
}
