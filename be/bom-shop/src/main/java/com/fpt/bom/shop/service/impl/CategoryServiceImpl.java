package com.fpt.bom.shop.service.impl;

import com.fpt.bom.shop.dto.CatalogDto.CategoryNode;
import com.fpt.bom.shop.dto.CatalogDto.CategoryRequest;
import com.fpt.bom.shop.entity.Category;
import com.fpt.bom.shop.repository.CategoryRepository;
import com.fpt.bom.shop.repository.ProductRepository;
import com.fpt.bom.shop.service.CategoryService;
import com.fpt.bom.shop.service.support.TextSupport;
import com.fpt.core.common.enums.StatusBasic;
import com.fpt.core.common.exception.BaseException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Deque;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryNode> publicTree() {
        return buildTree(categoryRepository.findByStatusOrderBySortOrderAscNameAsc(StatusBasic.ACTIVE));
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryNode> adminTree() {
        return buildTree(categoryRepository.findAllByOrderBySortOrderAscNameAsc());
    }

    @Override
    @Transactional
    public void create(CategoryRequest request) {
        validateParent(request.parentId(), null);
        Category category = new Category();
        apply(category, request);
        category.setSlug(uniqueSlug(request.name(), null));
        categoryRepository.save(category);
        log.info("Created category: id={}, name={}", category.getId(), category.getName());
    }

    @Override
    @Transactional
    public void update(CategoryRequest request) {
        Category category = categoryRepository.findById(Objects.requireNonNull(request.id()))
                .orElseThrow(() -> new BaseException("APP_DATA404"));
        validateParent(request.parentId(), category.getId());
        boolean renamed = !category.getName().equals(request.name().trim());
        apply(category, request);
        if (renamed) {
            category.setSlug(uniqueSlug(request.name(), category.getId()));
        }
        categoryRepository.save(category);
        log.info("Updated category: id={}", category.getId());
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        Category category = categoryRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new BaseException("APP_DATA404"));
        if (categoryRepository.existsByParentId(id)) {
            throw new BaseException("shop.category.hasChildren");
        }
        if (productRepository.existsByCategoryIdAndIsDeletedFalse(id)) {
            throw new BaseException("shop.category.inUse");
        }
        categoryRepository.delete(category);
        log.info("Deleted category: id={}", id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UUID> selfAndDescendantIds(UUID rootId) {
        if (rootId == null) {
            return List.of();
        }
        List<Category> all = categoryRepository.findAll();
        if (all.stream().noneMatch(c -> c.getId().equals(rootId))) {
            return List.of();
        }
        List<UUID> result = new ArrayList<>();
        Deque<UUID> queue = new ArrayDeque<>();
        queue.add(rootId);
        while (!queue.isEmpty()) {
            UUID current = queue.poll();
            if (result.contains(current)) {
                continue;
            }
            result.add(current);
            all.stream().filter(c -> current.equals(c.getParentId())).forEach(c -> queue.add(c.getId()));
        }
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Category> findActiveByName(String text) {
        String needle = TextSupport.fold(text);
        if (needle.isEmpty()) {
            return Optional.empty();
        }
        List<Category> active = categoryRepository.findByStatusOrderBySortOrderAscNameAsc(StatusBasic.ACTIVE);
        Optional<Category> exact = active.stream()
                .filter(c -> TextSupport.fold(c.getName()).equals(needle)).findFirst();
        if (exact.isPresent()) {
            return exact;
        }
        // Longest category name contained in the text wins ("quan ao" over "quan").
        return active.stream()
                .filter(c -> needle.contains(TextSupport.fold(c.getName()))
                        || (needle.length() >= 3 && TextSupport.fold(c.getName()).contains(needle)))
                .max(Comparator.comparingInt(c -> TextSupport.fold(c.getName()).length()));
    }

    private void apply(Category category, CategoryRequest request) {
        category.setName(request.name().trim());
        category.setParentId(request.parentId());
        category.setIcon(TextSupport.blankToNull(request.icon()));
        category.setImageUrl(TextSupport.fileUrl(request.imageUrl()));
        category.setSortOrder(request.sortOrder() != null ? request.sortOrder() : 0);
        category.setStatus(request.status() != null ? request.status() : StatusBasic.ACTIVE);
    }

    private void validateParent(UUID parentId, UUID selfId) {
        if (parentId == null) {
            return;
        }
        if (!categoryRepository.existsById(parentId)) {
            throw new BaseException("shop.category.parentInvalid");
        }
        if (selfId != null && selfIdAndDescendants(selfId).contains(parentId)) {
            throw new BaseException("shop.category.parentInvalid");
        }
    }

    private List<UUID> selfIdAndDescendants(UUID selfId) {
        return selfAndDescendantIds(selfId);
    }

    private String uniqueSlug(String name, UUID selfId) {
        String base = TextSupport.slugify(name);
        String slug = base;
        int attempt = 1;
        while (true) {
            Optional<Category> existing = categoryRepository.findBySlug(slug);
            if (existing.isEmpty() || existing.get().getId().equals(selfId)) {
                return slug;
            }
            slug = base + "-" + (++attempt);
        }
    }

    private List<CategoryNode> buildTree(List<Category> categories) {
        Map<UUID, List<Category>> byParent = new LinkedHashMap<>();
        Map<UUID, Category> byId = new LinkedHashMap<>();
        categories.forEach(c -> byId.put(c.getId(), c));
        List<Category> roots = new ArrayList<>();
        for (Category c : categories) {
            // A child whose parent is filtered out (inactive) is hidden with it.
            if (c.getParentId() == null) {
                roots.add(c);
            } else if (byId.containsKey(c.getParentId())) {
                byParent.computeIfAbsent(c.getParentId(), k -> new ArrayList<>()).add(c);
            }
        }
        return roots.stream().map(c -> toNode(c, byParent)).toList();
    }

    private CategoryNode toNode(Category c, Map<UUID, List<Category>> byParent) {
        List<CategoryNode> children = byParent.getOrDefault(c.getId(), List.of()).stream()
                .map(child -> toNode(child, byParent)).toList();
        return new CategoryNode(c.getId(), c.getName(), c.getSlug(), c.getIcon(), c.getImageUrl(),
                c.getParentId(), c.getSortOrder(), c.getStatus(), children);
    }
}
