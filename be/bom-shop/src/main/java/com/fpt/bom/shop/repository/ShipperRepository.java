package com.fpt.bom.shop.repository;

import com.fpt.bom.shop.entity.Shipper;
import com.fpt.bom.shop.enums.ApprovalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShipperRepository extends JpaRepository<Shipper, UUID>, JpaSpecificationExecutor<Shipper> {

    Optional<Shipper> findByUsername(String username);

    List<Shipper> findByUsernameIn(Collection<String> usernames);

    long countByStatus(ApprovalStatus status);
}
