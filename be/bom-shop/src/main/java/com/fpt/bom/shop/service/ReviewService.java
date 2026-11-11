package com.fpt.bom.shop.service;

import com.fpt.bom.shop.dto.CatalogDto.ReviewFilter;
import com.fpt.bom.shop.dto.CatalogDto.ReviewResponse;
import com.fpt.bom.shop.dto.CatalogDto.ReviewSummary;
import com.fpt.bom.shop.dto.OrderDto.ReviewCreateRequest;
import com.fpt.bom.shop.dto.SellerDto.ReviewReplyRequest;
import com.fpt.core.common.dto.PageResult;

import java.util.UUID;

public interface ReviewService {

    PageResult<ReviewResponse> productReviews(UUID productId, ReviewFilter filter);

    ReviewSummary summary(UUID productId);

    /** Buyer reviews an item of one of their COMPLETED orders. */
    void create(ReviewCreateRequest request);

    /** Seller listing of the reviews of the caller's store. */
    PageResult<ReviewResponse> sellerSearch(ReviewFilter filter);

    void reply(ReviewReplyRequest request);
}
