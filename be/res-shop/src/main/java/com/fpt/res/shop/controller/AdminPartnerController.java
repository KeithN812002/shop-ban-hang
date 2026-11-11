package com.fpt.res.shop.controller;

import com.fpt.bom.shop.dto.AdminDto.AccountFilter;
import com.fpt.bom.shop.dto.AdminDto.ApprovalFilter;
import com.fpt.bom.shop.dto.CommonDto.ReasonRequest;
import com.fpt.bom.shop.service.AccountService;
import com.fpt.bom.shop.service.ShipperService;
import com.fpt.bom.shop.service.StoreService;
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

/** Admin: stores, shippers and accounts (lock/unlock reuses the core sa/external-user endpoints). */
@RestController
@RequestMapping("/shop/admin")
@RequiredArgsConstructor
public class AdminPartnerController {

    private final StoreService storeService;
    private final ShipperService shipperService;
    private final AccountService accountService;

    @GetMapping("/store/search")
    public Response<?> searchStores(@Valid @ModelAttribute ApprovalFilter filter) {
        return Response.ok(storeService.adminSearch(filter));
    }

    @GetMapping("/store/{id}")
    public Response<?> store(@PathVariable UUID id) {
        return Response.ok(storeService.adminView(id));
    }

    @PostMapping("/store/approve")
    public Response<?> approveStore(@Valid @RequestBody ReasonRequest request) {
        storeService.approve(request);
        return Response.ok();
    }

    @PostMapping("/store/reject")
    public Response<?> rejectStore(@Valid @RequestBody ReasonRequest request) {
        storeService.reject(request);
        return Response.ok();
    }

    @PostMapping("/store/suspend")
    public Response<?> suspendStore(@Valid @RequestBody ReasonRequest request) {
        storeService.suspend(request);
        return Response.ok();
    }

    @PostMapping("/store/reactivate")
    public Response<?> reactivateStore(@Valid @RequestBody ReasonRequest request) {
        storeService.reactivate(request);
        return Response.ok();
    }

    @GetMapping("/shipper/search")
    public Response<?> searchShippers(@Valid @ModelAttribute ApprovalFilter filter) {
        return Response.ok(shipperService.adminSearch(filter));
    }

    @PostMapping("/shipper/approve")
    public Response<?> approveShipper(@Valid @RequestBody ReasonRequest request) {
        shipperService.approve(request);
        return Response.ok();
    }

    @PostMapping("/shipper/reject")
    public Response<?> rejectShipper(@Valid @RequestBody ReasonRequest request) {
        shipperService.reject(request);
        return Response.ok();
    }

    @PostMapping("/shipper/suspend")
    public Response<?> suspendShipper(@Valid @RequestBody ReasonRequest request) {
        shipperService.suspend(request);
        return Response.ok();
    }

    @PostMapping("/shipper/reactivate")
    public Response<?> reactivateShipper(@Valid @RequestBody ReasonRequest request) {
        shipperService.reactivate(request);
        return Response.ok();
    }

    @GetMapping("/account/search")
    public Response<?> searchAccounts(@Valid @ModelAttribute AccountFilter filter) {
        return Response.ok(accountService.adminSearch(filter));
    }
}
