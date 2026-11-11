package com.fpt.bom.shop.service.support;

import com.fpt.bom.shop.repository.PromotionProductRepository;
import com.fpt.bom.shop.repository.PromotionProductRepository.RunningRow;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * The one place that turns running shop promotions into effective prices. {@link #load} reads the promotions of a
 * whole set of products in a single query; every price surface (cards, detail, cart, checkout, chatbot) calls it
 * once per request and then prices items in memory.
 */
@Component
@RequiredArgsConstructor
public class PromotionPricing {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    /** A promotion that is running right now for one product. */
    public record Running(String name, int percent, LocalDateTime endAt) {
    }

    /** Running promotions keyed by product id. */
    public record Prices(Map<UUID, Running> byProduct) {

        public static final Prices NONE = new Prices(Map.of());

        /** The running promotion of the product, or null. */
        public Running running(UUID productId) {
            return byProduct.get(productId);
        }

        /** {@code price} after the running promotion of the product (unchanged when there is none). */
        public BigDecimal effective(UUID productId, BigDecimal price) {
            Running running = byProduct.get(productId);
            return running == null ? price : applyPercent(price, running.percent());
        }
    }

    private final PromotionProductRepository promotionProductRepository;

    /** Running promotions of {@code productIds} at the current time (one query). */
    public Prices load(Collection<UUID> productIds) {
        if (productIds.isEmpty()) {
            return Prices.NONE;
        }
        Map<UUID, Running> byProduct = new HashMap<>();
        for (RunningRow row : promotionProductRepository.findRunning(productIds, LocalDateTime.now())) {
            Running candidate = new Running(row.getName(), row.getDiscountPercent(), row.getEndAt());
            // Windows of one product never overlap; should data ever say otherwise the bigger discount wins.
            byProduct.merge(row.getProductId(), candidate,
                    (a, b) -> b.percent() > a.percent() ? b : a);
        }
        return new Prices(byProduct);
    }

    /** {@code price * (100 - percent) / 100} rounded to whole VND (HALF_UP). */
    public static BigDecimal applyPercent(BigDecimal price, int percent) {
        return price.multiply(BigDecimal.valueOf(100L - percent)).divide(HUNDRED, 0, RoundingMode.HALF_UP);
    }
}
