package com.fpt.bom.shop.service.support.chat;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class RuleBasedChatEngineTest {

    private final RuleBasedChatEngine engine = new RuleBasedChatEngine(null, null);

    @Test
    void parsesUpperBound() {
        BigDecimal[] range = engine.priceRange("ao thun duoi 500k");
        assertNull(range[0]);
        assertEquals(0, new BigDecimal("500000").compareTo(range[1]));
    }

    @Test
    void parsesRangeWithSharedUnit() {
        BigDecimal[] range = engine.priceRange("dien thoai tu 1 den 2 trieu");
        assertEquals(0, new BigDecimal("1000000").compareTo(range[0]));
        assertEquals(0, new BigDecimal("2000000").compareTo(range[1]));
    }

    @Test
    void parsesLowerBound() {
        BigDecimal[] range = engine.priceRange("laptop tren 15 trieu");
        assertEquals(0, new BigDecimal("15000000").compareTo(range[0]));
        assertNull(range[1]);
    }
}
