package com.fpt.res.shop.controller;

import com.fpt.bom.shop.dto.CartDto.AddressRequest;
import com.fpt.bom.shop.dto.CartDto.CartAddRequest;
import com.fpt.bom.shop.dto.CartDto.CartUpdateRequest;
import com.fpt.bom.shop.dto.CartDto.WishlistToggleRequest;
import com.fpt.bom.shop.service.AddressService;
import com.fpt.bom.shop.service.CartService;
import com.fpt.bom.shop.service.WishlistService;
import com.fpt.core.common.annotation.SkipPermissionCheck;
import com.fpt.core.common.dto.UUIDBulkRequest;
import com.fpt.core.common.dto.UUIDRequest;
import com.fpt.core.common.web.Response;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Cart, wishlist and address book of the signed-in user. */
@RestController
@RequestMapping("/shop/me")
@RequiredArgsConstructor
@SkipPermissionCheck
public class MeCartController {

    private final CartService cartService;
    private final WishlistService wishlistService;
    private final AddressService addressService;

    @GetMapping("/cart")
    public Response<?> cart() {
        return Response.ok(cartService.cart());
    }

    @PostMapping("/cart/add")
    public Response<?> add(@Valid @RequestBody CartAddRequest request) {
        cartService.add(request);
        return Response.ok();
    }

    @PostMapping("/cart/update")
    public Response<?> update(@Valid @RequestBody CartUpdateRequest request) {
        cartService.update(request);
        return Response.ok();
    }

    @PostMapping("/cart/delete")
    public Response<?> delete(@Valid @RequestBody UUIDBulkRequest request) {
        cartService.delete(request.getIds());
        return Response.ok();
    }

    @GetMapping("/wishlist")
    public Response<?> wishlist() {
        return Response.ok(wishlistService.list());
    }

    @PostMapping("/wishlist/toggle")
    public Response<?> toggle(@Valid @RequestBody WishlistToggleRequest request) {
        return Response.ok(wishlistService.toggle(request.productId()));
    }

    @GetMapping("/address")
    public Response<?> addresses() {
        return Response.ok(addressService.list());
    }

    @PostMapping("/address/create")
    public Response<?> createAddress(@Valid @RequestBody AddressRequest request) {
        addressService.create(request);
        return Response.ok();
    }

    @PostMapping("/address/update")
    public Response<?> updateAddress(@Valid @RequestBody AddressRequest request) {
        addressService.update(request);
        return Response.ok();
    }

    @PostMapping("/address/delete")
    public Response<?> deleteAddress(@Valid @RequestBody UUIDRequest request) {
        addressService.delete(request.getId());
        return Response.ok();
    }
}
