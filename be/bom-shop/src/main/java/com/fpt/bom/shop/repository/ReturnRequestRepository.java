package com.fpt.bom.shop.repository;

import com.fpt.bom.shop.entity.ReturnRequest;
import com.fpt.bom.shop.enums.ReturnRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, UUID> {

    Optional<ReturnRequest> findByOrderId(UUID orderId);

    List<ReturnRequest> findByOrderIdIn(Collection<UUID> orderIds);

    /** Order ids of requests in {@code status} that were created before {@code before} (seller never answered). */
    @Query("SELECT r.orderId FROM ReturnRequest r WHERE r.status = :status AND r.requestedAt < :before")
    List<UUID> findOrderIdsRequestedBefore(@Param("status") ReturnRequestStatus status,
            @Param("before") LocalDateTime before);

    /** Order ids of requests in {@code status} that the seller answered before {@code before}. */
    @Query("SELECT r.orderId FROM ReturnRequest r WHERE r.status = :status AND r.respondedAt < :before")
    List<UUID> findOrderIdsRespondedBefore(@Param("status") ReturnRequestStatus status,
            @Param("before") LocalDateTime before);
}
