package com.fpt.bom.shop.service;

import com.fpt.bom.shop.dto.PromotionDto.PromotionFilter;
import com.fpt.bom.shop.dto.PromotionDto.PromotionRequest;
import com.fpt.bom.shop.dto.PromotionDto.PromotionResponse;
import com.fpt.core.common.dto.PageResult;

import java.util.UUID;

/** Shop promotions (time-boxed percentage discounts) of the caller's own ACTIVE store. */
public interface PromotionService {

    PageResult<PromotionResponse> search(PromotionFilter filter);

    /** The promotion with its products. */
    PromotionResponse view(UUID id);

    PromotionResponse create(PromotionRequest request);

    PromotionResponse update(PromotionRequest request);

    /** Soft delete; prices go back to normal immediately. */
    void delete(UUID id);
}
