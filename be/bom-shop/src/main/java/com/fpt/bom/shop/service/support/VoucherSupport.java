package com.fpt.bom.shop.service.support;

import com.fpt.bom.shop.entity.Voucher;
import com.fpt.bom.shop.entity.VoucherUsage;
import com.fpt.bom.shop.enums.DiscountType;
import com.fpt.bom.shop.repository.VoucherRepository;
import com.fpt.bom.shop.repository.VoucherUsageRepository;
import com.fpt.core.common.enums.StatusBasic;
import com.fpt.core.common.exception.BaseException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

/** Voucher validation, discount calculation and usage accounting. */
@Component
@RequiredArgsConstructor
public class VoucherSupport {

    private final VoucherRepository voucherRepository;
    private final VoucherUsageRepository voucherUsageRepository;

    /** A voucher that passed every check together with the discount it grants. */
    public record Applied(Voucher voucher, BigDecimal discount) {
    }

    /**
     * Validates {@code code} for {@code username} against an order value and computes the discount.
     *
     * @param expectedStoreId the store the voucher must belong to, or null for a platform voucher
     * @param orderValue      merchandise value the minimum-order rule and the percentage apply to
     */
    public Applied validate(String code, UUID expectedStoreId, String username, BigDecimal orderValue) {
        Voucher voucher = voucherRepository.findByCodeIgnoreCase(Objects.requireNonNull(code).trim())
                .orElseThrow(() -> new BaseException("shop.voucher.notFound"));
        if (!Objects.equals(voucher.getStoreId(), expectedStoreId)) {
            throw new BaseException("shop.voucher.notApplicable");
        }
        requireUsable(voucher, username);
        BigDecimal minOrder = voucher.getMinOrderValue();
        if (minOrder != null && orderValue.compareTo(minOrder) < 0) {
            throw new BaseException("shop.voucher.minOrder", minOrder.setScale(0, RoundingMode.HALF_UP).toPlainString());
        }
        return new Applied(voucher, discount(voucher, orderValue));
    }

    /** True when the voucher is active, inside its window, not exhausted and not used up by the user. */
    public boolean isUsable(Voucher voucher, String username) {
        try {
            requireUsable(voucher, username);
            return true;
        } catch (BaseException e) {
            return false;
        }
    }

    /** Atomically takes one use of the voucher and records it against the order. */
    public void consume(Voucher voucher, UUID orderId, String username) {
        if (voucherRepository.consume(voucher.getId()) == 0) {
            throw new BaseException("shop.voucher.exhausted");
        }
        VoucherUsage usage = new VoucherUsage();
        usage.setVoucherId(voucher.getId());
        usage.setUsername(username);
        usage.setOrderId(orderId);
        voucherUsageRepository.save(usage);
    }

    /** Gives back the uses recorded for an order (cancelled before shipping). */
    public void restore(UUID orderId) {
        var usages = voucherUsageRepository.findByOrderId(orderId);
        usages.forEach(usage -> voucherRepository.release(usage.getVoucherId()));
        voucherUsageRepository.deleteAll(usages);
    }

    public static BigDecimal discount(Voucher voucher, BigDecimal orderValue) {
        BigDecimal raw;
        if (voucher.getDiscountType() == DiscountType.PERCENT) {
            raw = orderValue.multiply(voucher.getDiscountValue()).divide(BigDecimal.valueOf(100), 2,
                    RoundingMode.HALF_UP);
            BigDecimal cap = voucher.getMaxDiscount();
            if (cap != null && cap.signum() > 0 && raw.compareTo(cap) > 0) {
                raw = cap;
            }
        } else {
            raw = voucher.getDiscountValue();
        }
        return raw.min(orderValue).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }

    private void requireUsable(Voucher voucher, String username) {
        LocalDateTime now = LocalDateTime.now();
        if (voucher.getStatus() != StatusBasic.ACTIVE || now.isBefore(voucher.getStartAt())
                || now.isAfter(voucher.getEndAt())) {
            throw new BaseException("shop.voucher.expired");
        }
        Integer limit = voucher.getUsageLimit();
        if (limit != null && limit > 0 && voucher.getUsedCount() >= limit) {
            throw new BaseException("shop.voucher.exhausted");
        }
        Integer perUser = voucher.getPerUserLimit();
        if (perUser != null && perUser > 0 && username != null
                && voucherUsageRepository.countByVoucherIdAndUsername(voucher.getId(), username) >= perUser) {
            throw new BaseException("shop.voucher.userLimit");
        }
    }
}
