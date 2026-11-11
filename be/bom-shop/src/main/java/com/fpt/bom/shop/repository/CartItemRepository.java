package com.fpt.bom.shop.repository;

import com.fpt.bom.shop.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, UUID> {

    List<CartItem> findByUsernameOrderByCreatedDateDesc(String username);

    List<CartItem> findByUsernameAndSelectedTrueOrderByCreatedDateAsc(String username);

    Optional<CartItem> findByIdAndUsername(UUID id, String username);

    Optional<CartItem> findByUsernameAndProductIdAndVariantId(String username, UUID productId, UUID variantId);

    Optional<CartItem> findByUsernameAndProductIdAndVariantIdIsNull(String username, UUID productId);

    List<CartItem> findByUsernameAndIdIn(String username, Collection<UUID> ids);

    List<CartItem> findByUsername(String username);

    long countByUsername(String username);
}
