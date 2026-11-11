package com.fpt.bom.shop.service.support;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class TextSupportTest {

    @Test
    void slugifyRemovesVietnameseAccents() {
        assertEquals("dien-thoai-thong-minh", TextSupport.slugify("Điện thoại thông minh"));
    }

    @Test
    void discountPercentRoundsAndIgnoresNonDiscounts() {
        assertEquals(25, TextSupport.discountPercent(new BigDecimal("75000"), new BigDecimal("100000")));
        assertEquals(0, TextSupport.discountPercent(new BigDecimal("100000"), new BigDecimal("100000")));
        assertEquals(0, TextSupport.discountPercent(new BigDecimal("100000"), null));
    }

    @Test
    void fileUrlKeepsOnlyTheRelativePath() {
        assertEquals("/shop/public/file/2026/05/a.png",
                TextSupport.fileUrl("http://localhost:3000/api/shop/public/file/2026/05/a.png"));
        assertEquals("https://cdn.example.com/x.png", TextSupport.fileUrl("https://cdn.example.com/x.png"));
        assertNull(TextSupport.fileUrl("  "));
    }

    @Test
    void maskNameHidesTheMiddle() {
        assertEquals("N***n", TextSupport.maskName("Nguyen An"));
    }
}
