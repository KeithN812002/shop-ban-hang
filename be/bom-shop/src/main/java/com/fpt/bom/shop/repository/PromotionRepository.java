package com.fpt.bom.shop.repository;

import com.fpt.bom.shop.entity.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PromotionRepository extends JpaRepository<Promotion, UUID>, JpaSpecificationExecutor<Promotion> {

    Optional<Promotion> findByIdAndStoreIdAndIsDeletedFalse(UUID id, UUID storeId);
}
