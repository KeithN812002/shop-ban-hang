package com.fpt.bom.shop.repository;

import com.fpt.bom.shop.entity.PromotionProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface PromotionProductRepository extends JpaRepository<PromotionProduct, UUID> {

    /** A running promotion of one product. */
    interface RunningRow {
        UUID getProductId();

        String getName();

        Integer getDiscountPercent();

        LocalDateTime getEndAt();
    }

    List<PromotionProduct> findByPromotionId(UUID promotionId);

    List<PromotionProduct> findByPromotionIdIn(Collection<UUID> promotionIds);

    /** Promotions of the given products that are ACTIVE, not deleted and cover {@code now}. One query for all. */
    @Query("""
            SELECT pp.productId AS productId, pr.name AS name, pr.discountPercent AS discountPercent,
                   pr.endAt AS endAt
            FROM PromotionProduct pp JOIN Promotion pr ON pr.id = pp.promotionId
            WHERE pp.productId IN :productIds AND pr.isDeleted = false AND pr.status = com.fpt.core.common.enums.StatusBasic.ACTIVE
              AND pr.startAt <= :now AND pr.endAt > :now
            """)
    List<RunningRow> findRunning(@Param("productIds") Collection<UUID> productIds, @Param("now") LocalDateTime now);

    /** Ids (among {@code productIds}) already in another ACTIVE promotion whose window overlaps [start, end). */
    @Query("""
            SELECT DISTINCT pp.productId FROM PromotionProduct pp JOIN Promotion pr ON pr.id = pp.promotionId
            WHERE pp.productId IN :productIds AND pr.id <> :excludeId AND pr.isDeleted = false
              AND pr.status = com.fpt.core.common.enums.StatusBasic.ACTIVE AND pr.startAt < :end AND pr.endAt > :start
            """)
    List<UUID> findOverlapping(@Param("productIds") Collection<UUID> productIds, @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end, @Param("excludeId") UUID excludeId);

}
