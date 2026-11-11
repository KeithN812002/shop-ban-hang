package com.fpt.bom.shop.repository;

import com.fpt.bom.shop.entity.Store;
import com.fpt.bom.shop.enums.ApprovalStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StoreRepository extends JpaRepository<Store, UUID>, JpaSpecificationExecutor<Store> {

    Optional<Store> findByIdAndIsDeletedFalse(UUID id);

    Optional<Store> findByOwnerUsernameAndIsDeletedFalse(String ownerUsername);

    List<Store> findByIdInAndIsDeletedFalse(Collection<UUID> ids);

    List<Store> findByOwnerUsernameInAndIsDeletedFalse(Collection<String> ownerUsernames);

    /** Row lock that serializes a store's promotion changes so two saves cannot both pass the overlap check. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Store s WHERE s.id = :id")
    Optional<Store> lockById(@Param("id") UUID id);

    boolean existsBySlug(String slug);

    boolean existsByOwnerUsername(String ownerUsername);

    long countByStatusAndIsDeletedFalse(ApprovalStatus status);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
            UPDATE shop_store s SET product_count = (
                SELECT COUNT(*) FROM shop_product p
                WHERE p.store_id = s.id AND p.is_deleted = false AND p.status = 'ACTIVE')
            WHERE s.id = :storeId
            """, nativeQuery = true)
    void refreshProductCount(@Param("storeId") UUID storeId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
            UPDATE shop_store s SET follower_count = (
                SELECT COUNT(*) FROM shop_store_follow f WHERE f.store_id = s.id)
            WHERE s.id = :storeId
            """, nativeQuery = true)
    void refreshFollowerCount(@Param("storeId") UUID storeId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
            UPDATE shop_store s SET
                rating_avg = COALESCE((SELECT AVG(r.rating) FROM shop_review r WHERE r.store_id = s.id), 0),
                rating_count = (SELECT COUNT(*) FROM shop_review r WHERE r.store_id = s.id)
            WHERE s.id = :storeId
            """, nativeQuery = true)
    void refreshRating(@Param("storeId") UUID storeId);
}
