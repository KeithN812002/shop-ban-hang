package com.fpt.bom.shop.dto;

import lombok.Getter;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Dashboard shapes for seller, shipper and admin. */
public final class StatsDto {

    private StatsDto() {
    }

    /** Date range (defaults to the last 30 days), chart granularity and top-N size. */
    @Getter
    @Setter
    public static class StatsFilter {
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        private LocalDate fromDate;
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        private LocalDate toDate;
        /** DAY | MONTH */
        private String groupBy;
        private Integer limit;
    }

    public record SellerOverview(BigDecimal revenue, long orderCount, long pendingCount, long toShipCount,
            long confirmedCount, long readyToShipCount, long cancelledCount, long productCount,
            double ratingAvg, long viewCount) {
    }

    public record SellerRevenuePoint(String period, BigDecimal revenue, long orders) {
    }

    public record TopProduct(UUID productId, String name, String thumbnailUrl, long quantity,
            BigDecimal revenue) {
    }

    public record ShipperPoint(String period, BigDecimal earnings, long deliveries) {
    }

    public record ShipperStats(long deliveredCount, long failedCount, long returnedCount, BigDecimal codCollected,
            BigDecimal earnings, List<ShipperPoint> chart) {
    }

    public record AdminOverview(BigDecimal gmv, BigDecimal platformRevenue, long completedOrders,
            long cancelledOrders, long newUsers, long activeStores, long activeShippers, long pendingStores,
            long pendingShippers, Map<String, Long> ordersByStatus) {
    }

    public record AdminRevenuePoint(String period, BigDecimal gmv, BigDecimal platformRevenue, long orders) {
    }

    public record TopStore(UUID storeId, String name, String logoUrl, long orders, BigDecimal gmv) {
    }

    public record TopCategory(UUID categoryId, String name, long quantity, BigDecimal revenue) {
    }
}
