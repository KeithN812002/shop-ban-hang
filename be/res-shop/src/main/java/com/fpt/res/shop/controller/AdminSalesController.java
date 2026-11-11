package com.fpt.res.shop.controller;

import com.fpt.bom.shop.dto.CommonDto.ReasonRequest;
import com.fpt.bom.shop.dto.OrderDto.OrderFilter;
import com.fpt.bom.shop.dto.ReturnDto.RefundRequest;
import com.fpt.bom.shop.dto.ReturnDto.ReturnResolveRequest;
import com.fpt.bom.shop.dto.StatsDto.StatsFilter;
import com.fpt.bom.shop.service.AdminOrderService;
import com.fpt.bom.shop.service.StatsService;
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

/** Admin: platform-wide orders and dashboards. */
@RestController
@RequestMapping("/shop/admin")
@RequiredArgsConstructor
public class AdminSalesController {

    private final AdminOrderService orderService;
    private final StatsService statsService;

    @GetMapping("/order/search")
    public Response<?> searchOrders(@Valid @ModelAttribute OrderFilter filter) {
        return Response.ok(orderService.search(filter));
    }

    @GetMapping("/order/{id}")
    public Response<?> order(@PathVariable UUID id) {
        return Response.ok(orderService.detail(id));
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

    @PostMapping("/order/return/resolve")
    public Response<?> resolveReturn(@Valid @RequestBody ReturnResolveRequest request) {
        orderService.resolveReturn(request);
        return Response.ok();
    }

    @PostMapping("/order/return/refunded")
    public Response<?> markRefunded(@Valid @RequestBody RefundRequest request) {
        orderService.markRefunded(request);
        return Response.ok();
    }

    @GetMapping("/stats/overview")
    public Response<?> overview(@ModelAttribute StatsFilter filter) {
        return Response.ok(statsService.adminOverview(filter));
    }

    @GetMapping("/stats/revenue-chart")
    public Response<?> revenueChart(@ModelAttribute StatsFilter filter) {
        return Response.ok(statsService.adminRevenueChart(filter));
    }

    @GetMapping("/stats/top-stores")
    public Response<?> topStores(@ModelAttribute StatsFilter filter) {
        return Response.ok(statsService.adminTopStores(filter));
    }

    @GetMapping("/stats/top-products")
    public Response<?> topProducts(@ModelAttribute StatsFilter filter) {
        return Response.ok(statsService.adminTopProducts(filter));
    }

    @GetMapping("/stats/top-categories")
    public Response<?> topCategories(@ModelAttribute StatsFilter filter) {
        return Response.ok(statsService.adminTopCategories(filter));
    }
}
