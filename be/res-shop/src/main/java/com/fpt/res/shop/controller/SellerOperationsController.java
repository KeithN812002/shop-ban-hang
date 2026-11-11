package com.fpt.res.shop.controller;

import com.fpt.bom.shop.dto.ChatDto.SendMessageRequest;
import com.fpt.bom.shop.dto.CommonDto.ReasonRequest;
import com.fpt.bom.shop.dto.OrderDto.OrderFilter;
import com.fpt.bom.shop.dto.ReturnDto.RefundRequest;
import com.fpt.bom.shop.dto.ReturnDto.ReturnApproveRequest;
import com.fpt.bom.shop.dto.StatsDto.StatsFilter;
import com.fpt.bom.shop.service.ConversationService;
import com.fpt.bom.shop.service.SellerOrderService;
import com.fpt.bom.shop.service.StatsService;
import com.fpt.core.common.annotation.SkipPermissionCheck;
import com.fpt.core.common.dto.UUIDRequest;
import com.fpt.core.common.web.Response;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.UUID;

/** Seller Center: order handling, buyer chat and statistics. */
@RestController
@RequestMapping("/shop/seller")
@RequiredArgsConstructor
@SkipPermissionCheck
public class SellerOperationsController {

    private final SellerOrderService orderService;
    private final ConversationService conversationService;
    private final StatsService statsService;

    @GetMapping("/order/search")
    public Response<?> searchOrders(@Valid @ModelAttribute OrderFilter filter) {
        return Response.ok(orderService.search(filter));
    }

    @GetMapping("/order/{id}")
    public Response<?> order(@PathVariable UUID id) {
        return Response.ok(orderService.detail(id));
    }

    @PostMapping("/order/confirm")
    public Response<?> confirm(@Valid @RequestBody ReasonRequest request) {
        orderService.confirm(request);
        return Response.ok();
    }

    @PostMapping("/order/ready-to-ship")
    public Response<?> readyToShip(@Valid @RequestBody ReasonRequest request) {
        orderService.readyToShip(request);
        return Response.ok();
    }

    @PostMapping("/order/cancel")
    public Response<?> cancel(@Valid @RequestBody ReasonRequest request) {
        orderService.cancel(request);
        return Response.ok();
    }

    @PostMapping("/order/confirm-returned")
    public Response<?> confirmReturned(@Valid @RequestBody UUIDRequest request) {
        orderService.confirmReturned(request);
        return Response.ok();
    }

    @PostMapping("/order/return/approve")
    public Response<?> approveReturn(@Valid @RequestBody ReturnApproveRequest request) {
        orderService.approveReturn(request);
        return Response.ok();
    }

    @PostMapping("/order/return/reject")
    public Response<?> rejectReturn(@Valid @RequestBody ReasonRequest request) {
        orderService.rejectReturn(request);
        return Response.ok();
    }

    @PostMapping("/order/return/confirm-received")
    public Response<?> confirmReturnReceived(@Valid @RequestBody UUIDRequest request) {
        orderService.confirmReturnReceived(request);
        return Response.ok();
    }

    @PostMapping("/order/return/refunded")
    public Response<?> markRefunded(@Valid @RequestBody RefundRequest request) {
        orderService.markRefunded(request);
        return Response.ok();
    }

    @GetMapping("/conversation/list")
    public Response<?> conversations() {
        return Response.ok(conversationService.sellerList());
    }

    @GetMapping("/conversation/{id}/messages")
    public Response<?> messages(@PathVariable UUID id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime after) {
        return Response.ok(conversationService.sellerMessages(id, after));
    }

    @PostMapping("/conversation/send")
    public Response<?> send(@Valid @RequestBody SendMessageRequest request) {
        return Response.ok(conversationService.sellerSend(request));
    }

    @GetMapping("/stats/overview")
    public Response<?> overview(@ModelAttribute StatsFilter filter) {
        return Response.ok(statsService.sellerOverview(filter));
    }

    @GetMapping("/stats/revenue-chart")
    public Response<?> revenueChart(@ModelAttribute StatsFilter filter) {
        return Response.ok(statsService.sellerRevenueChart(filter));
    }

    @GetMapping("/stats/top-products")
    public Response<?> topProducts(@ModelAttribute StatsFilter filter) {
        return Response.ok(statsService.sellerTopProducts(filter));
    }
}
