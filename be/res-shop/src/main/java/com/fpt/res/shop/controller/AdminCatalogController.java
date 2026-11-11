package com.fpt.res.shop.controller;

import com.fpt.bom.shop.dto.CatalogDto.CategoryRequest;
import com.fpt.bom.shop.dto.CommonDto.ReasonRequest;
import com.fpt.bom.shop.dto.SellerDto.ProductFilter;
import com.fpt.bom.shop.dto.VoucherDto.VoucherFilter;
import com.fpt.bom.shop.dto.VoucherDto.VoucherRequest;
import com.fpt.bom.shop.service.AdminProductService;
import com.fpt.bom.shop.service.CategoryService;
import com.fpt.bom.shop.service.VoucherService;
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

/** Admin: categories, product moderation and platform vouchers (permission-checked, no skip annotation). */
@RestController
@RequestMapping("/shop/admin")
@RequiredArgsConstructor
public class AdminCatalogController {

    private final CategoryService categoryService;
    private final AdminProductService productService;
    private final VoucherService voucherService;

    @GetMapping("/category/tree")
    public Response<?> categoryTree() {
        return Response.ok(categoryService.adminTree());
    }

    @PostMapping("/category/create")
    public Response<?> createCategory(@Valid @RequestBody CategoryRequest request) {
        categoryService.create(request);
        return Response.ok();
    }

    @PostMapping("/category/update")
    public Response<?> updateCategory(@Valid @RequestBody CategoryRequest request) {
        categoryService.update(request);
        return Response.ok();
    }

    @PostMapping("/category/delete")
    public Response<?> deleteCategory(@Valid @RequestBody UUIDRequest request) {
        categoryService.delete(request.getId());
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

    @PostMapping("/product/ban")
    public Response<?> ban(@Valid @RequestBody ReasonRequest request) {
        productService.ban(request);
        return Response.ok();
    }

    @PostMapping("/product/unban")
    public Response<?> unban(@Valid @RequestBody ReasonRequest request) {
        productService.unban(request);
        return Response.ok();
    }

    @GetMapping("/voucher/search")
    public Response<?> searchVouchers(@Valid @ModelAttribute VoucherFilter filter) {
        return Response.ok(voucherService.search(false, filter));
    }

    @PostMapping("/voucher/create")
    public Response<?> createVoucher(@Valid @RequestBody VoucherRequest request) {
        return Response.ok(voucherService.create(false, request));
    }

    @PostMapping("/voucher/update")
    public Response<?> updateVoucher(@Valid @RequestBody VoucherRequest request) {
        return Response.ok(voucherService.update(false, request));
    }

    @PostMapping("/voucher/delete")
    public Response<?> deleteVoucher(@Valid @RequestBody UUIDRequest request) {
        voucherService.delete(false, request.getId());
        return Response.ok();
    }
}
