package com.fpt.bom.shop.service;

import com.fpt.bom.shop.dto.CartDto.CartAddRequest;
import com.fpt.bom.shop.dto.CartDto.CartResponse;
import com.fpt.bom.shop.dto.CartDto.CartUpdateRequest;
import com.fpt.bom.shop.dto.OrderDto.BuyNowRequest;

import java.util.List;
import java.util.UUID;

/** The authenticated buyer's shopping cart. */
public interface CartService {

    CartResponse cart();

    void add(CartAddRequest request);

    void update(CartUpdateRequest request);

    void delete(List<UUID> ids);

    /** Puts exactly the requested quantity of the item in the cart and selects only that line. */
    void buyNow(BuyNowRequest request);
}
