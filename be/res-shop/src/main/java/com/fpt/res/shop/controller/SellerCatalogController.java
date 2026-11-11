package com.fpt.res.shop.controller;

import com.fpt.bom.shop.dto.CatalogDto.ReviewFilter;
import com.fpt.bom.shop.dto.PromotionDto.PromotionFilter;
import com.fpt.bom.shop.dto.PromotionDto.PromotionRequest;
import com.fpt.bom.shop.dto.SellerDto.ProductFilter;
import com.fpt.bom.shop.dto.SellerDto.ProductRequest;
import com.fpt.bom.shop.dto.SellerDto.ReviewReplyRequest;
import com.fpt.bom.shop.dto.SellerDto.StoreUpdateRequest;
import com.fpt.bom.shop.dto.VoucherDto.VoucherFilter;
import com.fpt.bom.shop.dto.VoucherDto.VoucherRequest;
import com.fpt.bom.shop.service.PromotionService;
import com.fpt.bom.shop.service.ReviewService;
import com.fpt.bom.shop.service.SellerProductService;
import com.fpt.bom.shop.service.StoreService;
import com.fpt.bom.shop.service.VoucherService;
import com.fpt.core.common.annotation.SkipPermissionCheck;
import com.fpt.core.common.dto.UUIDBulkRequest;
import com.fpt.core.common.dto.UUIDRequest;
import com.fpt.core.common.web.Response;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/** Seller Center: store, products, vouchers, promotions and reviews. Ownership is enforced by the services. */
@RestController
@RequestMapping("/shop/seller")
@RequiredArgsConstructor
@SkipPermissionCheck
public class SellerCatalogController {

    private final StoreService storeService;
    private final SellerProductService productService;
    private final VoucherService voucherService;
    private final PromotionService promotionService;
    private final ReviewService reviewService;

    @GetMapping("/store")
    public Response<?> store() {
        return Response.ok(storeService.sellerStore());
    }

    @PostMapping("/store/update")
    public Response<?> updateStore(@Valid @RequestBody StoreUpdateRequest request) {
        storeService.sellerUpdate(request);
        return Response.ok();
    }

    @GetMapping("/product/search")
    public Response<?> searchProducts(@Valid @ModelAttribute ProductFilter filter) {
        return Response.ok(productService.search(filter));
    }

    @GetMapping("/product/{id}")
    public Response<?> product(@PathVariable UUID id) {
        return Response.ok(productService.view(id));
    }

    @PostMapping("/product/create")
    public Response<?> createProduct(@Valid @RequestBody ProductRequest request) {
        return Response.ok(productService.create(request));
    }

    @PostMapping("/product/update")
    public Response<?> updateProduct(@Valid @RequestBody ProductRequest request) {
        return Response.ok(productService.update(request));
    }

    @PostMapping("/product/delete")
    public Response<?> deleteProducts(@Valid @RequestBody UUIDBulkRequest request) {
        productService.delete(request.getIds());
        return Response.ok();
    }

    @GetMapping("/voucher/search")
    public Response<?> searchVouchers(@Valid @ModelAttribute VoucherFilter filter) {
        return Response.ok(voucherService.search(true, filter));
    }

    @PostMapping("/voucher/create")
    public Response<?> createVoucher(@Valid @RequestBody VoucherRequest request) {
        return Response.ok(voucherService.create(true, request));
    }

    @PostMapping("/voucher/update")
    public Response<?> updateVoucher(@Valid @RequestBody VoucherRequest request) {
        return Response.ok(voucherService.update(true, request));
    }

    @PostMapping("/voucher/delete")
    public Response<?> deleteVoucher(@Valid @RequestBody UUIDRequest request) {
        voucherService.delete(true, request.getId());
        return Response.ok();
    }

    @GetMapping("/promotion/search")
    public Response<?> searchPromotions(@Valid @ModelAttribute PromotionFilter filter) {
        return Response.ok(promotionService.search(filter));
    }

    @GetMapping("/promotion/{id}")
    public Response<?> promotion(@PathVariable UUID id) {
        return Response.ok(promotionService.view(id));
    }

    @PostMapping("/promotion/create")
    public Response<?> createPromotion(@Valid @RequestBody PromotionRequest request) {
        return Response.ok(promotionService.create(request));
    }

    @PostMapping("/promotion/update")
    public Response<?> updatePromotion(@Valid @RequestBody PromotionRequest request) {
        return Response.ok(promotionService.update(request));
    }

    @PostMapping("/promotion/delete")
    public Response<?> deletePromotion(@Valid @RequestBody UUIDRequest request) {
        promotionService.delete(request.getId());
        return Response.ok();
    }

    @GetMapping("/review/search")
    public Response<?> searchReviews(@Valid @ModelAttribute ReviewFilter filter) {
        return Response.ok(reviewService.sellerSearch(filter));
    }

    @PostMapping("/review/reply")
    public Response<?> reply(@Valid @RequestBody ReviewReplyRequest request) {
        reviewService.reply(request);
        return Response.ok();
    }
}
