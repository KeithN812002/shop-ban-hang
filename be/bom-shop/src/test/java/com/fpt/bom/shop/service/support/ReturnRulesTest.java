package com.fpt.bom.shop.service.support;

import com.fpt.bom.shop.config.ShopProperties;
import com.fpt.bom.shop.dto.ReturnDto.ReturnCreateRequest;
import com.fpt.bom.shop.entity.ReturnRequest;
import com.fpt.bom.shop.entity.ShopOrder;
import com.fpt.bom.shop.enums.OrderStatus;
import com.fpt.bom.shop.enums.ReturnReason;
import com.fpt.bom.shop.enums.ReturnRequestStatus;
import com.fpt.core.common.exception.BaseException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.function.Executable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ReturnRulesTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 6, 10, 12, 0);
    private final ShopProperties.Order cfg = new ShopProperties.Order();

    @Test
    void configDefaultsMatchTheContract() {
        assertEquals(7, cfg.getReturnWindowDays());
        assertEquals(3, cfg.getReturnResponseDays());
        assertEquals(3, cfg.getReturnDisputeDays());
    }

    @Test
    void returnWindowIsDeliveredAtPlusConfiguredDays() {
        ShopOrder order = delivered(NOW.minusDays(7));
        assertEquals(NOW, ReturnRules.returnDeadline(order.getDeliveredAt(), 7));
        assertTrue(ReturnRules.canRequestReturn(order, cfg, NOW));
        assertFalse(ReturnRules.canRequestReturn(order, cfg, NOW.plusSeconds(1)));
        assertNull(ReturnRules.returnDeadline(null, 7));
    }

    @Test
    void onlyDeliveredOrdersCanRequestAReturn() {
        ShopOrder order = delivered(NOW.minusDays(1));
        order.setStatus(OrderStatus.COMPLETED);
        assertFalse(ReturnRules.canRequestReturn(order, cfg, NOW));
    }

    @Test
    void responseDeadlineOnlyWhileRequested() {
        ReturnRequest request = request(ReturnRequestStatus.REQUESTED);
        request.setRequestedAt(NOW);
        assertEquals(NOW.plusDays(3), ReturnRules.responseDeadline(request, cfg));
        request.setStatus(ReturnRequestStatus.REJECTED);
        assertNull(ReturnRules.responseDeadline(request, cfg));
    }

    @Test
    void disputeDeadlineOnlyWhileRejected() {
        ReturnRequest request = request(ReturnRequestStatus.REJECTED);
        request.setRespondedAt(NOW);
        assertEquals(NOW.plusDays(3), ReturnRules.disputeDeadline(request, cfg));
        request.setStatus(ReturnRequestStatus.DISPUTED);
        assertNull(ReturnRules.disputeDeadline(request, cfg));
    }

    @Test
    void accountNumberMustBeSixToThirtyDigits() {
        assertTrue(ReturnRules.isValidAccountNo("123456"));
        assertTrue(ReturnRules.isValidAccountNo("1".repeat(30)));
        assertFalse(ReturnRules.isValidAccountNo("12345"));
        assertFalse(ReturnRules.isValidAccountNo("1".repeat(31)));
        assertFalse(ReturnRules.isValidAccountNo("12345a"));
        assertFalse(ReturnRules.isValidAccountNo("123 456"));
        assertFalse(ReturnRules.isValidAccountNo(null));
    }

    @Test
    void imagesAreNormalizedAndLimitedToSix() {
        List<String> ok = ReturnRules.validImages(
                List.of("https://host/api/shop/public/file/a.png", " /shop/public/file/b.png "));
        assertEquals(List.of("/shop/public/file/a.png", "/shop/public/file/b.png"), ok);
        assertEquals("shop.return.imagesRequired", code(() -> ReturnRules.validImages(null)));
        assertEquals("shop.return.imagesRequired", code(() -> ReturnRules.validImages(List.of(" "))));
        assertEquals("shop.return.imagesRequired",
                code(() -> ReturnRules.validImages(List.of("a", "b", "c", "d", "e", "f", "g"))));
    }

    @Test
    void bankDetailsAreValidatedAndTrimmed() {
        String[] bank = ReturnRules.validBank(bankRequest(" Vietcombank ", " 0123456789 ", " NGUYEN VAN A "));
        assertEquals("Vietcombank", bank[0]);
        assertEquals("0123456789", bank[1]);
        assertEquals("NGUYEN VAN A", bank[2]);
        assertEquals("shop.return.bankInvalid", code(() -> ReturnRules.validBank(bankRequest("VCB", "12ab", "A"))));
        assertEquals("shop.return.bankInvalid", code(() -> ReturnRules.validBank(bankRequest("", "123456", "A"))));
        assertEquals("shop.return.bankInvalid",
                code(() -> ReturnRules.validBank(bankRequest("VCB", "123456", null))));
    }

    private static ShopOrder delivered(LocalDateTime deliveredAt) {
        ShopOrder order = new ShopOrder();
        order.setStatus(OrderStatus.DELIVERED);
        order.setDeliveredAt(deliveredAt);
        return order;
    }

    private static ReturnRequest request(ReturnRequestStatus status) {
        ReturnRequest request = new ReturnRequest();
        request.setStatus(status);
        return request;
    }

    private static ReturnCreateRequest bankRequest(String bank, String accountNo, String holder) {
        return new ReturnCreateRequest(UUID.randomUUID(), ReturnReason.DAMAGED, null,
                List.of("/shop/public/file/a.png"), bank, accountNo, holder);
    }

    private static String code(Executable action) {
        return assertThrows(BaseException.class, action).getCode();
    }
}
