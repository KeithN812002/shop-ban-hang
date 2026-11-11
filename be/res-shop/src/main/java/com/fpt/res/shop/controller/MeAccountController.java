package com.fpt.res.shop.controller;

import com.fpt.bom.shop.dto.AccountDto.FollowRequest;
import com.fpt.bom.shop.dto.AccountDto.ShipperRegisterRequest;
import com.fpt.bom.shop.dto.AccountDto.StoreRegisterRequest;
import com.fpt.bom.shop.service.AccountService;
import com.fpt.bom.shop.service.FileService;
import com.fpt.bom.shop.service.ShipperService;
import com.fpt.bom.shop.service.StoreService;
import com.fpt.core.common.annotation.SkipPermissionCheck;
import com.fpt.core.common.web.Response;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

/** Profile, onboarding (store / shipper), store follows and image upload of the signed-in user. */
@RestController
@RequestMapping("/shop/me")
@RequiredArgsConstructor
@SkipPermissionCheck
public class MeAccountController {

    private final AccountService accountService;
    private final StoreService storeService;
    private final ShipperService shipperService;
    private final FileService fileService;

    @GetMapping("/profile")
    public Response<?> profile() {
        return Response.ok(accountService.profile());
    }

    @PostMapping("/store/register")
    public Response<?> registerStore(@Valid @RequestBody StoreRegisterRequest request) {
        storeService.register(request);
        return Response.ok();
    }

    @PostMapping("/shipper/register")
    public Response<?> registerShipper(@Valid @RequestBody ShipperRegisterRequest request) {
        shipperService.register(request);
        return Response.ok();
    }

    @PostMapping("/store/follow")
    public Response<?> follow(@Valid @RequestBody FollowRequest request) {
        return Response.ok(storeService.toggleFollow(request));
    }

    @GetMapping("/store/{id}/follow-status")
    public Response<?> followStatus(@PathVariable UUID id) {
        return Response.ok(storeService.followStatus(id));
    }

    @GetMapping("/store/followed")
    public Response<?> followed() {
        return Response.ok(storeService.followedStores());
    }

    @PostMapping(value = "/file/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Response<?> upload(@RequestPart("file") MultipartFile file) {
        return Response.ok(fileService.upload(file));
    }
}
