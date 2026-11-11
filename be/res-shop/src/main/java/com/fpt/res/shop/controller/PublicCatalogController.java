package com.fpt.res.shop.controller;

import com.fpt.bom.shop.dto.CatalogDto.ProductSearchFilter;
import com.fpt.bom.shop.dto.CatalogDto.ReviewFilter;
import com.fpt.bom.shop.service.CategoryService;
import com.fpt.bom.shop.service.ProductQueryService;
import com.fpt.bom.shop.service.ReviewService;
import com.fpt.bom.shop.service.StoreService;
import com.fpt.core.common.annotation.SkipPermissionCheck;
import com.fpt.core.common.web.Response;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/shop/public")
@RequiredArgsConstructor
@SkipPermissionCheck
public class PublicCatalogController {

    private final ProductQueryService productQueryService;
    private final CategoryService categoryService;
    private final ReviewService reviewService;
    private final StoreService storeService;

    @GetMapping("/home")
    public Response<?> home() {
        return Response.ok(productQueryService.home());
    }

    @GetMapping("/category/tree")
    public Response<?> categoryTree() {
        return Response.ok(categoryService.publicTree());
    }

    @GetMapping("/product/search")
    public Response<?> search(@Valid @ModelAttribute ProductSearchFilter filter) {
        return Response.ok(productQueryService.search(filter));
    }

    @GetMapping("/product/suggest")
    public Response<?> suggest(@RequestParam(required = false) String keyword) {
        return Response.ok(productQueryService.suggest(keyword));
    }

    @GetMapping("/product/{id}")
    public Response<?> detail(@PathVariable UUID id) {
        return Response.ok(productQueryService.detail(id));
    }

    @GetMapping("/product/{id}/related")
    public Response<?> related(@PathVariable UUID id) {
        return Response.ok(productQueryService.related(id));
    }

    @GetMapping("/product/{id}/reviews")
    public Response<?> reviews(@PathVariable UUID id, @Valid @ModelAttribute ReviewFilter filter) {
        return Response.ok(reviewService.productReviews(id, filter));
    }

    @GetMapping("/product/{id}/review-summary")
    public Response<?> reviewSummary(@PathVariable UUID id) {
        return Response.ok(reviewService.summary(id));
    }

    @GetMapping("/store/{id}")
    public Response<?> store(@PathVariable UUID id) {
        return Response.ok(storeService.publicStore(id));
    }
}
