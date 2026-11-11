package com.fpt.bom.shop.repository;

import com.fpt.bom.shop.entity.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, UUID> {

    List<Wishlist> findByUsernameOrderByCreatedDateDesc(String username);

    Optional<Wishlist> findByUsernameAndProductId(String username, UUID productId);
}
