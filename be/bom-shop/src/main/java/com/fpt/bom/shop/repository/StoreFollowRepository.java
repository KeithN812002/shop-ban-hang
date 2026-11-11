package com.fpt.bom.shop.repository;

import com.fpt.bom.shop.entity.StoreFollow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface StoreFollowRepository extends JpaRepository<StoreFollow, UUID> {

    Optional<StoreFollow> findByStoreIdAndUsername(UUID storeId, String username);

    java.util.List<StoreFollow> findByUsernameOrderByCreatedDateDesc(String username);
}
