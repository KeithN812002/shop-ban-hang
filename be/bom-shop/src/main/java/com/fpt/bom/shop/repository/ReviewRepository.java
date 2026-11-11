package com.fpt.bom.shop.repository;

import com.fpt.bom.shop.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID>, JpaSpecificationExecutor<Review> {

    boolean existsByOrderItemId(UUID orderItemId);

    Optional<Review> findByIdAndStoreId(UUID id, UUID storeId);

    List<Review> findByOrderItemIdIn(Collection<UUID> orderItemIds);

    interface RatingCount {
        Integer getRating();

        Long getTotal();
    }

    @Query(value = "SELECT r.rating AS rating, COUNT(*) AS total FROM shop_review r "
            + "WHERE r.product_id = :productId GROUP BY r.rating", nativeQuery = true)
    List<RatingCount> countByRating(@Param("productId") UUID productId);
}
