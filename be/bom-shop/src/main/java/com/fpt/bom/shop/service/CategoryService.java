package com.fpt.bom.shop.service;

import com.fpt.bom.shop.dto.CatalogDto.CategoryNode;
import com.fpt.bom.shop.dto.CatalogDto.CategoryRequest;
import com.fpt.bom.shop.entity.Category;

import java.util.List;
import java.util.UUID;

public interface CategoryService {

    /** Active categories only. */
    List<CategoryNode> publicTree();

    /** Every category with status and ordering. */
    List<CategoryNode> adminTree();

    void create(CategoryRequest request);

    void update(CategoryRequest request);

    void delete(UUID id);

    /** The category and all its descendants (empty list when the id is unknown). */
    List<UUID> selfAndDescendantIds(UUID rootId);

    /** Best active category whose accent-folded name matches the text, if any. */
    java.util.Optional<Category> findActiveByName(String text);
}
