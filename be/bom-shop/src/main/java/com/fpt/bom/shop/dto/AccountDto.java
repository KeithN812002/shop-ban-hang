package com.fpt.bom.shop.dto;

import com.fpt.bom.shop.enums.ApprovalStatus;
import com.fpt.core.common.constant.Constants;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/** Account-level shapes: profile, registration, store/shipper onboarding, follow. */
public final class AccountDto {

    private AccountDto() {
    }

    public record ProfileResponse(String username, String fullName, String email, Boolean isSeller, UUID storeId,
            ApprovalStatus storeStatus, String storeRejectReason, Boolean isShipper,
            ApprovalStatus shipperStatus, String shipperRejectReason, long unreadNotifications,
            long cartCount) {
    }

    public record RegisterRequest(
            @NotBlank(message = "{shop.validation.username}")
            @Size(max = 50, message = "{shop.validation.username}")
            @Pattern(regexp = Constants.REGEX.USER_NAME, message = "{shop.validation.username}")
            String username,
            @NotBlank(message = "{shop.validation.email}")
            @Email(regexp = Constants.REGEX.EMAIL, message = "{shop.validation.email}")
            @Size(max = 100, message = "{shop.validation.email}")
            String email,
            @NotBlank(message = "{shop.validation.password}")
            @Size(min = 6, max = 100, message = "{shop.validation.password}")
            String password,
            @NotBlank(message = "{shop.validation.required}") @Size(max = 200, message = "{shop.validation.size}")
            String fullName,
            @Pattern(regexp = Constants.REGEX.PHONE, message = "{shop.validation.phone}")
            @Size(max = 30, message = "{shop.validation.phone}")
            String phone) {
    }

    public record StoreRegisterRequest(
            @NotBlank(message = "{shop.validation.required}") @Size(max = 200, message = "{shop.validation.size}")
            String name,
            @Size(max = 4000, message = "{shop.validation.size}") String description,
            @NotBlank(message = "{shop.validation.phone}")
            @Pattern(regexp = Constants.REGEX.PHONE, message = "{shop.validation.phone}")
            @Size(max = 30, message = "{shop.validation.phone}")
            String phone,
            @NotBlank(message = "{shop.validation.required}") @Size(max = 500, message = "{shop.validation.size}")
            String address,
            @NotBlank(message = "{shop.validation.required}") @Size(max = 100, message = "{shop.validation.size}")
            String province,
            @Size(max = 500, message = "{shop.validation.size}") String logoUrl) {
    }

    public record ShipperRegisterRequest(
            @NotBlank(message = "{shop.validation.required}") @Size(max = 200, message = "{shop.validation.size}")
            String fullName,
            @NotBlank(message = "{shop.validation.phone}")
            @Pattern(regexp = Constants.REGEX.PHONE, message = "{shop.validation.phone}")
            @Size(max = 30, message = "{shop.validation.phone}")
            String phone,
            @NotBlank(message = "{shop.validation.required}") @Size(max = 30, message = "{shop.validation.size}")
            String idNumber,
            @Size(max = 50, message = "{shop.validation.size}") String vehicleType,
            @Size(max = 30, message = "{shop.validation.size}") String vehiclePlate,
            @NotBlank(message = "{shop.validation.required}") @Size(max = 100, message = "{shop.validation.size}")
            String areaProvince) {
    }

    public record FollowRequest(@NotNull(message = "{shop.validation.required}") UUID storeId) {
    }

    public record FollowResponse(boolean followed) {
    }

    public record ShipperResponse(UUID id, String username, String fullName, String phone, String idNumber,
            String vehicleType, String vehiclePlate, String areaProvince, ApprovalStatus status,
            String rejectReason) {
    }
}
