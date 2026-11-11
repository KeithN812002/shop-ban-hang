package com.fpt.res.shop.controller;

import com.fpt.bom.shop.dto.CommonDto.ReasonRequest;
import com.fpt.bom.shop.dto.OrderDto.DeliveredRequest;
import com.fpt.bom.shop.dto.OrderDto.OrderFilter;
import com.fpt.bom.shop.dto.StatsDto.StatsFilter;
import com.fpt.bom.shop.service.ShipperOrderService;
import com.fpt.bom.shop.service.ShipperService;
import com.fpt.bom.shop.service.StatsService;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/** Delivery work of the signed-in shipper. */
@RestController
@RequestMapping("/shop/shipper")
@RequiredArgsConstructor
@SkipPermissionCheck
public class ShipperController {

    private final ShipperService shipperService;
    private final ShipperOrderService orderService;
    private final StatsService statsService;

    @GetMapping("/profile")
    public Response<?> profile() {
        return Response.ok(shipperService.profile());
    }

    @GetMapping("/order/available")
    public Response<?> available(@Valid @ModelAttribute OrderFilter filter) {
        return Response.ok(orderService.available(filter));
    }

    @GetMapping("/order/my")
    public Response<?> mine(@Valid @ModelAttribute OrderFilter filter) {
        return Response.ok(orderService.mine(filter));
    }

    @GetMapping("/order/{id}")
    public Response<?> order(@PathVariable UUID id) {
        return Response.ok(orderService.detail(id));
    }

    @PostMapping("/order/accept")
    public Response<?> accept(@Valid @RequestBody UUIDRequest request) {
        orderService.accept(request.getId());
        return Response.ok();
    }

    @PostMapping("/order/picked-up")
    public Response<?> pickedUp(@Valid @RequestBody UUIDRequest request) {
        orderService.pickedUp(request.getId());
        return Response.ok();
    }

    @PostMapping("/order/delivered")
    public Response<?> delivered(@Valid @RequestBody DeliveredRequest request) {
        orderService.delivered(request);
        return Response.ok();
    }

    @PostMapping("/order/failed")
    public Response<?> failed(@Valid @RequestBody ReasonRequest request) {
        orderService.failed(request);
        return Response.ok();
    }

    @GetMapping("/stats")
    public Response<?> stats(@ModelAttribute StatsFilter filter) {
        return Response.ok(statsService.shipperStats(filter));
    }
}
