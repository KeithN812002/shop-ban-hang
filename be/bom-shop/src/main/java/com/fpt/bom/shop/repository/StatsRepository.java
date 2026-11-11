package com.fpt.bom.shop.repository;

import com.fpt.bom.shop.entity.ShopOrder;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Aggregate (PostgreSQL) queries for the dashboards. Ranges are half-open {@code [from, to)}; aliases are
 * quoted so the camelCase projection getters resolve.
 */
public interface StatsRepository extends Repository<ShopOrder, UUID> {

    interface SellerOverviewRow {
        BigDecimal getRevenue();

        Long getOrderCount();

        Long getCancelledCount();

        Long getPendingCount();

        Long getToShipCount();

        Long getConfirmedCount();

        Long getReadyToShipCount();
    }

    @Query(value = """
            SELECT COALESCE(SUM(o.seller_income) FILTER (WHERE o.status = 'COMPLETED'
                        AND o.completed_at >= :start AND o.completed_at < :end), 0) AS "revenue",
                   COUNT(*) FILTER (WHERE o.created_date >= :start AND o.created_date < :end) AS "orderCount",
                   COUNT(*) FILTER (WHERE o.status = 'CANCELLED'
                        AND o.cancelled_at >= :start AND o.cancelled_at < :end) AS "cancelledCount",
                   COUNT(*) FILTER (WHERE o.status = 'PENDING') AS "pendingCount",
                   COUNT(*) FILTER (WHERE o.status IN ('CONFIRMED', 'READY_TO_SHIP')) AS "toShipCount",
                   COUNT(*) FILTER (WHERE o.status = 'CONFIRMED') AS "confirmedCount",
                   COUNT(*) FILTER (WHERE o.status = 'READY_TO_SHIP') AS "readyToShipCount"
            FROM shop_order o WHERE o.store_id = :storeId
            """, nativeQuery = true)
    SellerOverviewRow sellerOverview(@Param("storeId") UUID storeId, @Param("start") LocalDateTime from,
            @Param("end") LocalDateTime to);

    interface ProductTotalsRow {
        Long getProductCount();

        Long getViewCount();
    }

    @Query(value = """
            SELECT COUNT(*) FILTER (WHERE p.status = 'ACTIVE') AS "productCount",
                   COALESCE(SUM(p.view_count), 0) AS "viewCount"
            FROM shop_product p WHERE p.store_id = :storeId AND p.is_deleted = false
            """, nativeQuery = true)
    ProductTotalsRow productTotals(@Param("storeId") UUID storeId);

    interface RevenueRow {
        String getPeriod();

        BigDecimal getRevenue();

        BigDecimal getPlatformRevenue();

        Long getOrders();
    }

    @Query(value = """
            SELECT to_char(date_trunc(CAST(:unit AS text), o.completed_at), CAST(:fmt AS text)) AS "period",
                   COALESCE(SUM(o.seller_income), 0) AS "revenue", CAST(0 AS numeric) AS "platformRevenue", COUNT(*) AS "orders"
            FROM shop_order o
            WHERE o.store_id = :storeId AND o.status = 'COMPLETED'
              AND o.completed_at >= :start AND o.completed_at < :end
            GROUP BY 1 ORDER BY 1
            """, nativeQuery = true)
    List<RevenueRow> sellerRevenueChart(@Param("storeId") UUID storeId, @Param("unit") String unit,
            @Param("fmt") String fmt, @Param("start") LocalDateTime from, @Param("end") LocalDateTime to);

    /** Admin chart: {@code revenue} is GMV (sum of order totals), {@code platformRevenue} fee minus discount. */
    @Query(value = """
            SELECT to_char(date_trunc(CAST(:unit AS text), o.completed_at), CAST(:fmt AS text)) AS "period",
                   COALESCE(SUM(o.total), 0) AS "revenue",
                   COALESCE(SUM(o.platform_fee - o.platform_discount), 0) AS "platformRevenue",
                   COUNT(*) AS "orders"
            FROM shop_order o
            WHERE o.status = 'COMPLETED' AND o.completed_at >= :start AND o.completed_at < :end
            GROUP BY 1 ORDER BY 1
            """, nativeQuery = true)
    List<RevenueRow> adminRevenueChart(@Param("unit") String unit, @Param("fmt") String fmt,
            @Param("start") LocalDateTime from, @Param("end") LocalDateTime to);

    interface TopProductRow {
        UUID getProductId();

        String getName();

        String getThumbnailUrl();

        Long getQuantity();

        BigDecimal getRevenue();
    }

    /** Top products by revenue of COMPLETED orders; {@code storeId} null = whole platform. */
    @Query(value = """
            SELECT oi.product_id AS "productId", MAX(oi.product_name) AS "name",
                   MAX(p.thumbnail_url) AS "thumbnailUrl", SUM(oi.quantity) AS "quantity",
                   SUM(oi.price * oi.quantity) AS "revenue"
            FROM shop_order_item oi
            JOIN shop_order o ON o.id = oi.order_id
            LEFT JOIN shop_product p ON p.id = oi.product_id
            WHERE o.status = 'COMPLETED' AND o.completed_at >= :start AND o.completed_at < :end
              AND (CAST(:storeId AS uuid) IS NULL OR o.store_id = CAST(:storeId AS uuid))
            GROUP BY oi.product_id
            ORDER BY SUM(oi.price * oi.quantity) DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<TopProductRow> topProducts(@Param("storeId") UUID storeId, @Param("start") LocalDateTime from,
            @Param("end") LocalDateTime to, @Param("limit") int limit);

    interface TopStoreRow {
        UUID getStoreId();

        String getName();

        String getLogoUrl();

        Long getOrders();

        BigDecimal getGmv();
    }

    @Query(value = """
            SELECT o.store_id AS "storeId", MAX(s.name) AS "name", MAX(s.logo_url) AS "logoUrl",
                   COUNT(*) AS "orders", SUM(o.total) AS "gmv"
            FROM shop_order o JOIN shop_store s ON s.id = o.store_id
            WHERE o.status = 'COMPLETED' AND o.completed_at >= :start AND o.completed_at < :end
            GROUP BY o.store_id
            ORDER BY SUM(o.total) DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<TopStoreRow> topStores(@Param("start") LocalDateTime from, @Param("end") LocalDateTime to,
            @Param("limit") int limit);

    interface TopCategoryRow {
        UUID getCategoryId();

        String getName();

        Long getQuantity();

        BigDecimal getRevenue();
    }

    @Query(value = """
            SELECT c.id AS "categoryId", c.name AS "name", SUM(oi.quantity) AS "quantity",
                   SUM(oi.price * oi.quantity) AS "revenue"
            FROM shop_order_item oi
            JOIN shop_order o ON o.id = oi.order_id
            JOIN shop_product p ON p.id = oi.product_id
            JOIN shop_category c ON c.id = p.category_id
            WHERE o.status = 'COMPLETED' AND o.completed_at >= :start AND o.completed_at < :end
            GROUP BY c.id, c.name
            ORDER BY SUM(oi.price * oi.quantity) DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<TopCategoryRow> topCategories(@Param("start") LocalDateTime from, @Param("end") LocalDateTime to,
            @Param("limit") int limit);

    interface AdminOverviewRow {
        BigDecimal getGmv();

        BigDecimal getPlatformRevenue();

        Long getCompletedOrders();

        Long getCancelledOrders();
    }

    @Query(value = """
            SELECT COALESCE(SUM(o.total) FILTER (WHERE o.status = 'COMPLETED'
                        AND o.completed_at >= :start AND o.completed_at < :end), 0) AS "gmv",
                   COALESCE(SUM(o.platform_fee - o.platform_discount) FILTER (WHERE o.status = 'COMPLETED'
                        AND o.completed_at >= :start AND o.completed_at < :end), 0) AS "platformRevenue",
                   COUNT(*) FILTER (WHERE o.status = 'COMPLETED'
                        AND o.completed_at >= :start AND o.completed_at < :end) AS "completedOrders",
                   COUNT(*) FILTER (WHERE o.status = 'CANCELLED'
                        AND o.cancelled_at >= :start AND o.cancelled_at < :end) AS "cancelledOrders"
            FROM shop_order o
            """, nativeQuery = true)
    AdminOverviewRow adminOverview(@Param("start") LocalDateTime from, @Param("end") LocalDateTime to);

    interface StatusCountRow {
        String getStatus();

        Long getTotal();
    }

    @Query(value = """
            SELECT o.status AS "status", COUNT(*) AS "total" FROM shop_order o
            WHERE o.created_date >= :start AND o.created_date < :end GROUP BY o.status
            """, nativeQuery = true)
    List<StatusCountRow> ordersByStatus(@Param("start") LocalDateTime from, @Param("end") LocalDateTime to);

    @Query(value = """
            SELECT COUNT(*) FROM sa_user u
            WHERE u.is_internal = false AND u.is_deleted = false
              AND u.created_date >= :start AND u.created_date < :end
            """, nativeQuery = true)
    long newUsers(@Param("start") LocalDateTime from, @Param("end") LocalDateTime to);

    interface ShipperRow {
        Long getDeliveredCount();

        Long getReturnedCount();

        BigDecimal getCodCollected();

        BigDecimal getEarnings();
    }

    @Query(value = """
            SELECT COUNT(*) FILTER (WHERE o.delivered_at >= :start AND o.delivered_at < :end) AS "deliveredCount",
                   (SELECT COUNT(*) FROM shop_order_history h JOIN shop_order r ON r.id = h.order_id
                     WHERE h.action = 'RETURNING' AND r.shipper_username = :username
                       AND h.created_date >= :start AND h.created_date < :end) AS "returnedCount",
                   COALESCE(SUM(o.total) FILTER (WHERE o.status IN ('DELIVERED', 'COMPLETED', 'RETURN_REQUESTED',
                            'RETURN_APPROVED', 'RETURN_SHIPPING', 'RETURN_RECEIVED', 'REFUNDED')
                        AND o.delivered_at >= :start AND o.delivered_at < :end), 0) AS "codCollected",
                   COALESCE(SUM(o.shipper_fee) FILTER (WHERE
                        (o.status = 'COMPLETED' AND o.completed_at >= :start AND o.completed_at < :end)
                        OR (o.status = 'REFUNDED' AND o.refunded_at >= :start AND o.refunded_at < :end)), 0) AS "earnings"
            FROM shop_order o WHERE o.shipper_username = :username
            """, nativeQuery = true)
    ShipperRow shipperTotals(@Param("username") String username, @Param("start") LocalDateTime from,
            @Param("end") LocalDateTime to);

    @Query(value = """
            SELECT COUNT(*) FROM shop_order_history h
            WHERE h.action = 'DELIVERY_FAILED' AND h.actor = :username
              AND h.created_date >= :start AND h.created_date < :end
            """, nativeQuery = true)
    long shipperFailed(@Param("username") String username, @Param("start") LocalDateTime from,
            @Param("end") LocalDateTime to);

    interface ShipperPointRow {
        String getPeriod();

        BigDecimal getEarnings();

        Long getDeliveries();
    }

    @Query(value = """
            SELECT to_char(date_trunc(CAST(:unit AS text), o.delivered_at), CAST(:fmt AS text)) AS "period",
                   COALESCE(SUM(o.shipper_fee), 0) AS "earnings", COUNT(*) AS "deliveries"
            FROM shop_order o
            WHERE o.shipper_username = :username AND o.delivered_at >= :start AND o.delivered_at < :end
            GROUP BY 1 ORDER BY 1
            """, nativeQuery = true)
    List<ShipperPointRow> shipperChart(@Param("username") String username, @Param("unit") String unit,
            @Param("fmt") String fmt, @Param("start") LocalDateTime from, @Param("end") LocalDateTime to);
}
