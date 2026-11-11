package com.fpt.bom.shop.repository;

import com.fpt.bom.shop.entity.ShopOrder;
import com.fpt.bom.shop.enums.OrderStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<ShopOrder, UUID>, JpaSpecificationExecutor<ShopOrder> {

    boolean existsByCode(String code);

    Optional<ShopOrder> findByIdAndBuyerUsername(UUID id, String buyerUsername);

    Optional<ShopOrder> findByIdAndStoreId(UUID id, UUID storeId);

    /** Row lock used by every status transition so concurrent actors are serialized. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM ShopOrder o WHERE o.id = :id")
    Optional<ShopOrder> lockById(@Param("id") UUID id);

    interface BuyerTotals {
        String getBuyer();

        Long getOrders();

        java.math.BigDecimal getSpent();
    }

    /** Order count and money spent (DELIVERED/COMPLETED orders) per buyer. */
    @Query(value = """
            SELECT o.buyer_username AS buyer, COUNT(*) AS orders,
                   COALESCE(SUM(o.total) FILTER (WHERE o.status IN ('DELIVERED', 'COMPLETED')), 0) AS spent
            FROM shop_order o WHERE o.buyer_username IN (:usernames) GROUP BY o.buyer_username
            """, nativeQuery = true)
    List<BuyerTotals> totalsByBuyer(@Param("usernames") java.util.Collection<String> usernames);

    @Query("SELECT o.id FROM ShopOrder o WHERE o.status = :status AND o.deliveredAt < :before")
    List<UUID> findIdsByStatusDeliveredBefore(@Param("status") OrderStatus status,
            @Param("before") LocalDateTime before);
}
