package com.fpt.bom.shop.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Shop configuration bound from the {@code shop} prefix (Consul). Defaults mirror the contract.
 */
@Data
@Component
@ConfigurationProperties(prefix = "shop")
public class ShopProperties {

    private Ai ai = new Ai();
    private Order order = new Order();
    private Storage storage = new Storage();
    private String publicFileBase = "/shop/public/file/";
    private Cors cors = new Cors();

    @Data
    public static class Cors {
        /** Browser origins allowed to call the API directly (admin web, storefront). */
        private java.util.List<String> allowedOrigins = new java.util.ArrayList<>();
    }

    @Data
    public static class Ai {
        /** Empty = rule-based fallback only. */
        private String anthropicApiKey = "";
        private String model = "claude-sonnet-5-5";
        private String baseUrl = "https://api.anthropic.com";
        private int rateLimitPerMinute = 10;
        private int timeoutSeconds = 20;
    }

    @Data
    public static class Order {
        private BigDecimal shippingFee = BigDecimal.valueOf(30000);
        private BigDecimal freeShipThreshold = BigDecimal.valueOf(500000);
        private int platformFeePercent = 5;
        private int shipperFeePercent = 80;
        private int autoCompleteDays = 7;
        /** Days after delivery during which the buyer may request a return. */
        private int returnWindowDays = 7;
        /** Days the seller has to answer a return request before it is approved automatically. */
        private int returnResponseDays = 3;
        /** Days the buyer has to dispute a rejected return request before the order completes. */
        private int returnDisputeDays = 3;
    }

    @Data
    public static class Storage {
        private String bucket = "shop";
    }
}
