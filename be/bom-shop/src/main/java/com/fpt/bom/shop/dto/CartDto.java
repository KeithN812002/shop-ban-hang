package com.fpt.bom.shop.dto;

import com.fpt.bom.shop.dto.CommonDto.StoreRef;
import com.fpt.core.common.constant.Constants;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/** Cart, wishlist and address-book shapes. */
public final class CartDto {

    private CartDto() {
    }

    public record CartAddRequest(
            @NotNull(message = "{shop.validation.required}") UUID productId,
            UUID variantId,
            @Min(value = 1, message = "{shop.validation.quantity}")
            @Max(value = 999, message = "{shop.validation.quantity}") int quantity) {
    }

    public record CartUpdateRequest(
            @NotNull(message = "{common.id.notNull}") UUID id,
            @Min(value = 1, message = "{shop.validation.quantity}")
            @Max(value = 999, message = "{shop.validation.quantity}") Integer quantity,
            Boolean selected) {
    }

    public record CartLine(UUID id, UUID productId, UUID variantId, String name, String variantName,
            String imageUrl, BigDecimal price, int quantity, int stock, boolean selected, boolean available) {
    }

    public record CartGroup(StoreRef store, List<CartLine> items) {
    }

    public record CartResponse(List<CartGroup> groups) {
    }

    public record WishlistToggleRequest(@NotNull(message = "{shop.validation.required}") UUID productId) {
    }

    public record WishlistToggleResponse(boolean liked) {
    }

    public record AddressRequest(
            UUID id,
            @NotBlank(message = "{shop.validation.required}") @Size(max = 200, message = "{shop.validation.size}")
            String receiverName,
            @NotBlank(message = "{shop.validation.phone}")
            @Pattern(regexp = Constants.REGEX.PHONE, message = "{shop.validation.phone}")
            @Size(max = 30, message = "{shop.validation.phone}")
            String phone,
            @NotBlank(message = "{shop.validation.required}") @Size(max = 100, message = "{shop.validation.size}")
            String province,
            @Size(max = 100, message = "{shop.validation.size}") String district,
            @Size(max = 100, message = "{shop.validation.size}") String ward,
            @NotBlank(message = "{shop.validation.required}") @Size(max = 500, message = "{shop.validation.size}")
            String detail,
            Boolean isDefault) {
    }

    public record AddressResponse(UUID id, String receiverName, String phone, String province, String district,
            String ward, String detail, Boolean isDefault) {
    }
}
