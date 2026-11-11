package com.fpt.bom.shop.repository;

import com.fpt.bom.shop.entity.Product;
import com.fpt.bom.shop.enums.ApprovalStatus;
import com.fpt.bom.shop.enums.ProductStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {

    Optional<Product> findByIdAndIsDeletedFalse(UUID id);

    Optional<Product> findByIdAndStoreIdAndIsDeletedFalse(UUID id, UUID storeId);

    List<Product> findByIdInAndIsDeletedFalse(Collection<UUID> ids);

    List<Product> findByStoreIdAndIsDeletedFalse(UUID storeId);

    boolean existsByCategoryIdAndIsDeletedFalse(UUID categoryId);

    /**
     * Visible products with a manual discount (original price above price) or in a running shop promotion, the
     * biggest manual discounts first. The caller re-ranks them by their final discount percent.
     */
    @Query("""
            SELECT p FROM Product p
            WHERE p.isDeleted = false AND p.status = :status
              AND (p.originalPrice > p.price OR p.id IN (
                    SELECT pp.productId FROM PromotionProduct pp JOIN Promotion pr ON pr.id = pp.promotionId
                    WHERE pr.isDeleted = false AND pr.status = com.fpt.core.common.enums.StatusBasic.ACTIVE
                      AND pr.startAt <= :now AND pr.endAt > :now))
              AND p.storeId IN (SELECT s.id FROM Store s WHERE s.status = :storeStatus AND s.isDeleted = false)
            ORDER BY CASE WHEN p.originalPrice > p.price THEN (p.originalPrice - p.price) / p.originalPrice
                          ELSE 0 END DESC, p.soldCount DESC
            """)
    List<Product> findFlashDeals(@Param("status") ProductStatus status,
            @Param("storeStatus") ApprovalStatus storeStatus, @Param("now") LocalDateTime now, Pageable pageable);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Product p SET p.viewCount = p.viewCount + 1 WHERE p.id = :id")
    void incrementViewCount(@Param("id") UUID id);

    /** Atomic conditional decrement; returns 1 when stock was sufficient, 0 otherwise. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Product p SET p.stock = p.stock - :qty WHERE p.id = :id AND p.stock >= :qty")
    int decrementStock(@Param("id") UUID id, @Param("qty") int qty);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Product p SET p.stock = p.stock + :qty WHERE p.id = :id")
    void incrementStock(@Param("id") UUID id, @Param("qty") int qty);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Product p SET p.soldCount = p.soldCount + :qty WHERE p.id = :id")
    void incrementSold(@Param("id") UUID id, @Param("qty") int qty);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
            UPDATE shop_product p SET
                rating_avg = COALESCE((SELECT AVG(r.rating) FROM shop_review r WHERE r.product_id = p.id), 0),
                rating_count = (SELECT COUNT(*) FROM shop_review r WHERE r.product_id = p.id)
            WHERE p.id = :productId
            """, nativeQuery = true)
    void refreshRating(@Param("productId") UUID productId);

    /**
     * Trending ids: 3 x units sold + 1 x view_count + 2 x search hits on the name, all within the window
     * (view_count is cumulative, the contract keeps no per-day view log).
     */
    @Query(value = """
            SELECT t.id FROM (
                SELECT p.id AS id, p.created_date AS created_date,
                    3 * COALESCE(sold.units, 0)
                    + 1 * p.view_count
                    + 2 * (SELECT COUNT(*) FROM shop_search_log l
                           WHERE l.created_date >= :since AND strpos(lower(p.name), l.keyword) > 0) AS score
                FROM shop_product p
                JOIN shop_store s ON s.id = p.store_id AND s.status = 'ACTIVE' AND s.is_deleted = false
                LEFT JOIN (
                    SELECT oi.product_id AS pid, SUM(oi.quantity) AS units
                    FROM shop_order_item oi JOIN shop_order o ON o.id = oi.order_id
                    WHERE o.created_date >= :since AND o.status NOT IN ('CANCELLED', 'RETURNING', 'RETURNED', 'RETURN_RECEIVED', 'REFUNDED')
                    GROUP BY oi.product_id) sold ON sold.pid = p.id
                WHERE p.status = 'ACTIVE' AND p.is_deleted = false
                  AND (:allCategories = true OR p.category_id IN (:categoryIds))
            ) t
            ORDER BY t.score DESC, t.created_date DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<UUID> findTrendingIds(@Param("since") LocalDateTime since,
            @Param("allCategories") boolean allCategories,
            @Param("categoryIds") Collection<UUID> categoryIds,
            @Param("limit") int limit);
}
