package com.fpt.res.shop.controller;

import com.fpt.bom.shop.dto.OrderDto.BuyNowRequest;
import com.fpt.bom.shop.dto.OrderDto.CancelRequest;
import com.fpt.bom.shop.dto.OrderDto.CheckoutRequest;
import com.fpt.bom.shop.dto.OrderDto.OrderFilter;
import com.fpt.bom.shop.dto.OrderDto.ReviewCreateRequest;
import com.fpt.bom.shop.dto.ReturnDto.ReturnCreateRequest;
import com.fpt.bom.shop.dto.ReturnDto.ReturnDisputeRequest;
import com.fpt.bom.shop.dto.ReturnDto.ReturnWithdrawRequest;
import com.fpt.bom.shop.service.CartService;
import com.fpt.bom.shop.service.OrderService;
import com.fpt.bom.shop.service.ReviewService;
import com.fpt.bom.shop.service.VoucherService;
import com.fpt.core.common.annotation.SkipPermissionCheck;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/** Vouchers, checkout, order history and reviews of the signed-in buyer. */
@RestController
@RequestMapping("/shop/me")
@RequiredArgsConstructor
@SkipPermissionCheck
public class MeOrderController {

    private final OrderService orderService;
    private final CartService cartService;
    private final VoucherService voucherService;
    private final ReviewService reviewService;

    @GetMapping("/voucher/available")
    public Response<?> availableVouchers(@RequestParam(required = false) UUID storeId) {
        return Response.ok(voucherService.available(storeId));
    }

    @PostMapping("/order/preview")
    public Response<?> preview(@Valid @RequestBody CheckoutRequest request) {
        return Response.ok(orderService.preview(request));
    }

    @PostMapping("/order/create")
    public Response<?> create(@Valid @RequestBody CheckoutRequest request) {
        return Response.ok(orderService.create(request));
    }

    @PostMapping("/order/buy-now")
    public Response<?> buyNow(@Valid @RequestBody BuyNowRequest request) {
        cartService.buyNow(request);
        return Response.ok();
    }

    @GetMapping("/order/search")
    public Response<?> search(@Valid @ModelAttribute OrderFilter filter) {
        return Response.ok(orderService.search(filter));
    }

    @GetMapping("/order/{id}")
    public Response<?> detail(@PathVariable UUID id) {
        return Response.ok(orderService.detail(id));
    }

    @PostMapping("/order/cancel")
    public Response<?> cancel(@Valid @RequestBody CancelRequest request) {
        orderService.cancel(request);
        return Response.ok();
    }

    @PostMapping("/order/confirm-received")
    public Response<?> confirmReceived(@Valid @RequestBody UUIDRequest request) {
        orderService.confirmReceived(request.getId());
        return Response.ok();
    }

    @PostMapping("/order/return/request")
    public Response<?> requestReturn(@Valid @RequestBody ReturnCreateRequest request) {
        orderService.requestReturn(request);
        return Response.ok();
    }

    @PostMapping("/order/return/dispute")
    public Response<?> disputeReturn(@Valid @RequestBody ReturnDisputeRequest request) {
        orderService.disputeReturn(request);
        return Response.ok();
    }

    @PostMapping("/order/return/withdraw")
    public Response<?> withdrawReturn(@Valid @RequestBody ReturnWithdrawRequest request) {
        orderService.withdrawReturn(request);
        return Response.ok();
    }

    @PostMapping("/review/create")
    public Response<?> createReview(@Valid @RequestBody ReviewCreateRequest request) {
        reviewService.create(request);
        return Response.ok();
    }
}
