package com.fpt.bom.shop.dto;

import com.fpt.bom.shop.enums.DiscountType;
import com.fpt.core.common.dto.PagingBase;
import com.fpt.core.common.enums.StatusBasic;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public final class VoucherDto {

    private VoucherDto() {
    }

    public record VoucherRequest(
            UUID id,
            @NotBlank(message = "{shop.validation.voucherCode}")
            @Size(min = 3, max = 50, message = "{shop.validation.voucherCode}")
            @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "{shop.validation.voucherCode}")
            String code,
            @NotBlank(message = "{shop.validation.required}") @Size(max = 200, message = "{shop.validation.size}")
            String name,
            @NotNull(message = "{shop.validation.required}") DiscountType discountType,
            @NotNull(message = "{shop.validation.amount}")
            @DecimalMin(value = "0.01", message = "{shop.validation.amount}") BigDecimal discountValue,
            @DecimalMin(value = "0", message = "{shop.validation.amount}") BigDecimal maxDiscount,
            @DecimalMin(value = "0", message = "{shop.validation.amount}") BigDecimal minOrderValue,
            @NotNull(message = "{shop.validation.required}") LocalDateTime startAt,
            @NotNull(message = "{shop.validation.required}") LocalDateTime endAt,
            Integer usageLimit,
            Integer perUserLimit,
            StatusBasic status) {
    }

    public record VoucherResponse(UUID id, UUID storeId, String code, String name, DiscountType discountType,
            BigDecimal discountValue, BigDecimal maxDiscount, BigDecimal minOrderValue, LocalDateTime startAt,
            LocalDateTime endAt, Integer usageLimit, int usedCount, Integer perUserLimit, StatusBasic status) {
    }

    @Getter
    @Setter
    public static class VoucherFilter extends PagingBase {
        private String keyword;
        private StatusBasic status;
    }
}
