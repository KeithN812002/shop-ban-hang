package com.fpt.bom.shop.service.support;

import com.fpt.bom.shop.config.ShopProperties;
import com.fpt.bom.shop.dto.ReturnDto.ReturnCreateRequest;
import com.fpt.bom.shop.entity.ReturnRequest;
import com.fpt.bom.shop.entity.ShopOrder;
import com.fpt.bom.shop.enums.OrderStatus;
import com.fpt.bom.shop.enums.ReturnRequestStatus;
import com.fpt.core.common.exception.BaseException;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Pattern;

/** Pure rules of the buyer return flow: deadlines and input validation. */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class ReturnRules {

    public static final int MAX_IMAGES = 6;
    private static final int MAX_BANK_TEXT = 100;
    private static final int MAX_URL = 500;
    private static final Pattern ACCOUNT_NO = Pattern.compile("^[0-9]{6,30}$");

    /** Last moment a buyer may request a return, or {@code null} when the order was not delivered. */
    public static LocalDateTime returnDeadline(LocalDateTime deliveredAt, int windowDays) {
        return deliveredAt == null ? null : deliveredAt.plusDays(windowDays);
    }

    /** The buyer can still request a return: DELIVERED and inside the window. */
    public static boolean canRequestReturn(ShopOrder order, ShopProperties.Order cfg, LocalDateTime now) {
        if (order.getStatus() != OrderStatus.DELIVERED) {
            return false;
        }
        LocalDateTime deadline = returnDeadline(order.getDeliveredAt(), cfg.getReturnWindowDays());
        return deadline != null && !now.isAfter(deadline);
    }

    /** Deadline of the seller answer; only while the request is still REQUESTED. */
    public static LocalDateTime responseDeadline(ReturnRequest request, ShopProperties.Order cfg) {
        return request.getStatus() == ReturnRequestStatus.REQUESTED
                ? request.getRequestedAt().plusDays(cfg.getReturnResponseDays()) : null;
    }

    /** Deadline of the buyer dispute; only while the request is REJECTED. */
    public static LocalDateTime disputeDeadline(ReturnRequest request, ShopProperties.Order cfg) {
        return request.getStatus() == ReturnRequestStatus.REJECTED && request.getRespondedAt() != null
                ? request.getRespondedAt().plusDays(cfg.getReturnDisputeDays()) : null;
    }

    public static boolean isValidAccountNo(String value) {
        return value != null && ACCOUNT_NO.matcher(value).matches();
    }

    /** Normalized (trimmed, relative-URL) images of a request; 1..6 are required. */
    public static List<String> validImages(List<String> urls) {
        List<String> images = TextSupport.fileUrls(urls);
        if (images.isEmpty() || images.size() > MAX_IMAGES || images.stream().anyMatch(u -> u.length() > MAX_URL)
                || images.stream().anyMatch(u -> u.contains(","))) {
            throw new BaseException("shop.return.imagesRequired");
        }
        return images;
    }

    /** Validates bank name / account number (digits, 6..30) / holder name; returns the trimmed values. */
    public static String[] validBank(ReturnCreateRequest request) {
        String name = TextSupport.blankToNull(request.bankName());
        String accountNo = TextSupport.blankToNull(request.bankAccountNo());
        String holder = TextSupport.blankToNull(request.bankAccountName());
        if (name == null || name.length() > MAX_BANK_TEXT || holder == null || holder.length() > MAX_BANK_TEXT
                || !isValidAccountNo(accountNo)) {
            throw new BaseException("shop.return.bankInvalid");
        }
        return new String[] { name, accountNo, holder };
    }
}
