package com.fpt.bom.shop.repository;

import com.fpt.bom.shop.entity.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, UUID>, JpaSpecificationExecutor<Voucher> {

    Optional<Voucher> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    /** Atomic usage increment honouring the usage limit; returns 1 on success, 0 when exhausted. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE Voucher v SET v.usedCount = v.usedCount + 1
            WHERE v.id = :id AND (v.usageLimit IS NULL OR v.usageLimit <= 0 OR v.usedCount < v.usageLimit)
            """)
    int consume(@Param("id") UUID id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Voucher v SET v.usedCount = v.usedCount - 1 WHERE v.id = :id AND v.usedCount > 0")
    void release(@Param("id") UUID id);
}
