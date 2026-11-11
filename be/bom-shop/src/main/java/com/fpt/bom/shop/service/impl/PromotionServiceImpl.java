package com.fpt.bom.shop.service.impl;

import com.fpt.bom.shop.dto.PromotionDto.PromotionFilter;
import com.fpt.bom.shop.dto.PromotionDto.PromotionRequest;
import com.fpt.bom.shop.dto.PromotionDto.PromotionResponse;
import com.fpt.bom.shop.dto.PromotionDto.SellerProductRow;
import com.fpt.bom.shop.entity.Product;
import com.fpt.bom.shop.entity.Promotion;
import com.fpt.bom.shop.entity.PromotionProduct;
import com.fpt.bom.shop.entity.Store;
import com.fpt.bom.shop.enums.PromotionState;
import com.fpt.bom.shop.repository.ProductRepository;
import com.fpt.bom.shop.repository.PromotionProductRepository;
import com.fpt.bom.shop.repository.PromotionRepository;
import com.fpt.bom.shop.repository.StoreRepository;
import com.fpt.bom.shop.service.PromotionService;
import com.fpt.bom.shop.service.support.AccessSupport;
import com.fpt.bom.shop.service.support.PromotionPricing;
import com.fpt.core.common.dto.PageResult;
import com.fpt.core.common.enums.StatusBasic;
import com.fpt.core.common.exception.BaseException;
import com.fpt.core.common.util.TextUtils;
import com.fpt.core.persistence.spec.SpecificationBuilder;
import com.fpt.core.persistence.util.PageableUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.fpt.core.persistence.spec.JpaFieldSpecifications.eq;

@Slf4j
@Service
@RequiredArgsConstructor
public class PromotionServiceImpl implements PromotionService {

    private static final UUID NIL_UUID = new UUID(0L, 0L);

    private final PromotionRepository promotionRepository;
    private final PromotionProductRepository promotionProductRepository;
    private final ProductRepository productRepository;
    private final StoreRepository storeRepository;
    private final AccessSupport accessSupport;

    @Override
    @Transactional(readOnly = true)
    public PageResult<PromotionResponse> search(PromotionFilter filter) {
        Store store = accessSupport.requireActiveStore(accessSupport.currentUsername());
        LocalDateTime now = LocalDateTime.now();
        SpecificationBuilder<Promotion> builder = new SpecificationBuilder<>();
        builder.and(eq("storeId", store.getId()));
        builder.and(eq("isDeleted", false));
        builder.and(keyword(filter.getKeyword()));
        builder.and(state(filter.getState(), now));
        Page<Promotion> page = promotionRepository.findAll(builder.build(),
                Objects.requireNonNull(PageableUtils.pageable(filter)));
        Map<UUID, Long> counts = promotionProductRepository
                .findByPromotionIdIn(page.getContent().stream().map(Promotion::getId).toList()).stream()
                .collect(Collectors.groupingBy(PromotionProduct::getPromotionId, Collectors.counting()));
        return PageableUtils.toPageResult(page,
                p -> toResponse(p, now, counts.getOrDefault(p.getId(), 0L).intValue(), null));
    }

    @Override
    @Transactional(readOnly = true)
    public PromotionResponse view(UUID id) {
        Store store = accessSupport.requireActiveStore(accessSupport.currentUsername());
        return detail(requireOwned(id, store));
    }

    @Override
    @Transactional
    public PromotionResponse create(PromotionRequest request) {
        Store store = lockOwnStore();
        List<UUID> productIds = validate(request, store, null);
        Promotion promotion = new Promotion();
        promotion.setStoreId(store.getId());
        apply(promotion, request);
        promotionRepository.save(promotion);
        productIds.forEach(productId -> link(promotion.getId(), productId));
        log.info("Promotion created: id={}, store={}, percent={}, products={}", promotion.getId(), store.getId(),
                promotion.getDiscountPercent(), productIds.size());
        return detail(promotion);
    }

    @Override
    @Transactional
    public PromotionResponse update(PromotionRequest request) {
        Store store = lockOwnStore();
        Promotion promotion = requireOwned(request.id(), store);
        List<UUID> productIds = validate(request, store, promotion.getId());
        apply(promotion, request);
        promotionRepository.save(promotion);

        List<PromotionProduct> existing = promotionProductRepository.findByPromotionId(promotion.getId());
        Set<UUID> wanted = Set.copyOf(productIds);
        promotionProductRepository.deleteAll(
                existing.stream().filter(l -> !wanted.contains(l.getProductId())).toList());
        Set<UUID> kept = existing.stream().map(PromotionProduct::getProductId).collect(Collectors.toSet());
        productIds.stream().filter(productId -> !kept.contains(productId))
                .forEach(productId -> link(promotion.getId(), productId));
        promotionProductRepository.flush();
        log.info("Promotion updated: id={}, products={}", promotion.getId(), productIds.size());
        return detail(promotion);
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        Store store = accessSupport.requireActiveStore(accessSupport.currentUsername());
        Promotion promotion = requireOwned(id, store);
        promotion.setDeleted(true);
        promotion.setDeletedDate(LocalDateTime.now());
        promotion.setDeletedBy(accessSupport.currentUsername());
        promotionRepository.save(promotion);
        log.info("Promotion deleted: id={}", id);
    }

    /** The caller's ACTIVE store, row-locked so concurrent saves of its promotions run one after another. */
    private Store lockOwnStore() {
        Store store = accessSupport.requireActiveStore(accessSupport.currentUsername());
        return storeRepository.lockById(store.getId()).orElseThrow(() -> new BaseException("APP_DATA404"));
    }

    private Promotion requireOwned(UUID id, Store store) {
        return promotionRepository.findByIdAndStoreIdAndIsDeletedFalse(Objects.requireNonNull(id), store.getId())
                .orElseThrow(() -> new BaseException("APP_DATA404"));
    }

    /**
     * Checks the window, that every product is a live product of the store and (for an ACTIVE promotion) that no
     * product is in another ACTIVE promotion over the same window. Returns the de-duplicated product ids.
     */
    private List<UUID> validate(PromotionRequest request, Store store, UUID excludeId) {
        if (!request.endAt().isAfter(request.startAt())) {
            throw new BaseException("shop.promotion.timeRange");
        }
        List<UUID> productIds = request.productIds().stream().distinct().toList();
        Map<UUID, Product> products = productRepository.findByIdInAndIsDeletedFalse(productIds).stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));
        if (products.size() != productIds.size()
                || products.values().stream().anyMatch(p -> !p.getStoreId().equals(store.getId()))) {
            throw new BaseException("shop.promotion.productInvalid");
        }
        if (request.status() != StatusBasic.INACTIVE) {
            List<UUID> overlapping = promotionProductRepository.findOverlapping(productIds, request.startAt(),
                    request.endAt(), excludeId != null ? excludeId : NIL_UUID);
            if (!overlapping.isEmpty()) {
                throw new BaseException("shop.promotion.overlap", products.get(overlapping.get(0)).getName());
            }
        }
        return productIds;
    }

    private void apply(Promotion promotion, PromotionRequest request) {
        promotion.setName(request.name().trim());
        promotion.setDiscountPercent(request.discountPercent());
        promotion.setStartAt(request.startAt());
        promotion.setEndAt(request.endAt());
        promotion.setStatus(request.status() != null ? request.status() : StatusBasic.ACTIVE);
    }

    private void link(UUID promotionId, UUID productId) {
        PromotionProduct link = new PromotionProduct();
        link.setPromotionId(promotionId);
        link.setProductId(productId);
        promotionProductRepository.save(link);
    }

    private PromotionResponse detail(Promotion promotion) {
        List<UUID> productIds = promotionProductRepository.findByPromotionId(promotion.getId()).stream()
                .map(PromotionProduct::getProductId).toList();
        List<SellerProductRow> rows = productRepository.findByIdInAndIsDeletedFalse(productIds).stream()
                .sorted(Comparator.comparing(Product::getName, String.CASE_INSENSITIVE_ORDER))
                .map(p -> new SellerProductRow(p.getId(), p.getName(), p.getThumbnailUrl(), p.getPrice(),
                        PromotionPricing.applyPercent(p.getPrice(), promotion.getDiscountPercent()), p.getStock(),
                        p.getStatus()))
                .toList();
        return toResponse(promotion, LocalDateTime.now(), productIds.size(), rows);
    }

    private PromotionResponse toResponse(Promotion p, LocalDateTime now, int productCount,
            List<SellerProductRow> products) {
        return new PromotionResponse(p.getId(), p.getName(), p.getDiscountPercent(), p.getStartAt(), p.getEndAt(),
                p.getStatus(), stateOf(p, now), productCount, products, p.getCreatedDate());
    }

    private static PromotionState stateOf(Promotion p, LocalDateTime now) {
        if (p.getStatus() != StatusBasic.ACTIVE) {
            return PromotionState.INACTIVE;
        }
        if (now.isBefore(p.getStartAt())) {
            return PromotionState.UPCOMING;
        }
        return now.isBefore(p.getEndAt()) ? PromotionState.RUNNING : PromotionState.ENDED;
    }

    private static Specification<Promotion> keyword(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) {
                return cb.conjunction();
            }
            String pattern = "%" + TextUtils.escapeSqlLike(keyword.trim().toLowerCase()) + "%";
            return cb.like(cb.lower(root.get("name")), pattern, '\\');
        };
    }

    /** Mirrors {@link #stateOf}: INACTIVE wins over the time window. */
    private static Specification<Promotion> state(PromotionState state, LocalDateTime now) {
        return (root, query, cb) -> {
            if (state == null) {
                return cb.conjunction();
            }
            var active = cb.equal(root.get("status"), StatusBasic.ACTIVE);
            return switch (state) {
                case INACTIVE -> cb.notEqual(root.get("status"), StatusBasic.ACTIVE);
                case UPCOMING -> cb.and(active, cb.greaterThan(root.get("startAt"), now));
                case RUNNING -> cb.and(active, cb.lessThanOrEqualTo(root.get("startAt"), now),
                        cb.greaterThan(root.get("endAt"), now));
                case ENDED -> cb.and(active, cb.lessThanOrEqualTo(root.get("endAt"), now));
            };
        };
    }
}
