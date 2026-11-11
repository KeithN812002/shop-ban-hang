package com.fpt.bom.shop.service.support;

import com.fpt.bom.shop.service.support.PromotionPricing.Prices;
import com.fpt.bom.shop.service.support.PromotionPricing.Running;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class PromotionPricingTest {

    @Test
    void applyPercentRoundsToWholeVndHalfUp() {
        assertEquals(new BigDecimal("75000"), PromotionPricing.applyPercent(new BigDecimal("100000"), 25));
        assertEquals(new BigDecimal("33"), PromotionPricing.applyPercent(new BigDecimal("99"), 67));
        // 1001 * 0.5 = 500.5 -> 501
        assertEquals(new BigDecimal("501"), PromotionPricing.applyPercent(new BigDecimal("1001.00"), 50));
    }

    @Test
    void effectivePriceOnlyChangesForProductsWithARunningPromotion() {
        UUID promoted = UUID.randomUUID();
        UUID plain = UUID.randomUUID();
        Prices prices = new Prices(Map.of(promoted, new Running("Sale", 20, LocalDateTime.now().plusDays(1))));
        BigDecimal price = new BigDecimal("250000.00");

        assertEquals(new BigDecimal("200000"), prices.effective(promoted, price));
        assertEquals(price, prices.effective(plain, price));
        assertNull(prices.running(plain));
        assertEquals(price, Prices.NONE.effective(promoted, price));
    }
}
