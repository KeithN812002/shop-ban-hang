package com.fpt.bom.shop.repository;

import com.fpt.bom.shop.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, UUID> {

    List<OrderItem> findByOrderIdOrderByCreatedDateAsc(UUID orderId);

    List<OrderItem> findByOrderIdIn(Collection<UUID> orderIds);
}
