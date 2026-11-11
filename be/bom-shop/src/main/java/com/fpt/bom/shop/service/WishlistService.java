package com.fpt.bom.shop.service;

import com.fpt.bom.shop.dto.CartDto.WishlistToggleResponse;
import com.fpt.bom.shop.dto.CatalogDto.ProductCard;

import java.util.List;
import java.util.UUID;

public interface WishlistService {

    /** Liked products that are still visible, newest first. */
    List<ProductCard> list();

    WishlistToggleResponse toggle(UUID productId);
}
