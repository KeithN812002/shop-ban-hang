package com.fpt.bom.shop.repository;

import com.fpt.bom.shop.entity.Category;
import com.fpt.core.common.enums.StatusBasic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {

    List<Category> findByStatusOrderBySortOrderAscNameAsc(StatusBasic status);

    List<Category> findAllByOrderBySortOrderAscNameAsc();

    Optional<Category> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsByParentId(UUID parentId);
}
