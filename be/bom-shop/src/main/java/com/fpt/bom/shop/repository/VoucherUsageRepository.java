package com.fpt.bom.shop.repository;

import com.fpt.bom.shop.entity.VoucherUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VoucherUsageRepository extends JpaRepository<VoucherUsage, UUID> {

    long countByVoucherIdAndUsername(UUID voucherId, String username);

    List<VoucherUsage> findByOrderId(UUID orderId);
}
