package com.fpt.bom.shop.service.impl;

import com.fpt.bom.shop.constant.ShopConstants;
import com.fpt.bom.shop.dto.CatalogDto.HomeResponse;
import com.fpt.bom.shop.dto.CatalogDto.ProductCard;
import com.fpt.bom.shop.dto.CatalogDto.ProductDetail;
import com.fpt.bom.shop.dto.CatalogDto.ProductSearchFilter;
import com.fpt.bom.shop.dto.CatalogDto.VariantResponse;
import com.fpt.bom.shop.entity.Category;
import com.fpt.bom.shop.entity.Product;
import com.fpt.bom.shop.entity.ProductImage;
import com.fpt.bom.shop.entity.SearchLog;
import com.fpt.bom.shop.entity.Store;
import com.fpt.bom.shop.enums.ApprovalStatus;
import com.fpt.bom.shop.enums.ProductStatus;
import com.fpt.bom.shop.repository.CategoryRepository;
import com.fpt.bom.shop.repository.ProductImageRepository;
import com.fpt.bom.shop.repository.ProductRepository;
import com.fpt.bom.shop.repository.ProductVariantRepository;
import com.fpt.bom.shop.repository.SearchLogRepository;
import com.fpt.bom.shop.repository.StoreRepository;
import com.fpt.bom.shop.service.CategoryService;
import com.fpt.bom.shop.service.ProductQueryService;
import com.fpt.bom.shop.service.support.AccessSupport;
import com.fpt.bom.shop.service.support.ProductSpecs;
import com.fpt.bom.shop.service.support.PromotionPricing;
import com.fpt.bom.shop.service.support.PromotionPricing.Prices;
import com.fpt.bom.shop.service.support.PromotionPricing.Running;
import com.fpt.bom.shop.service.support.ShopMapper;
import com.fpt.bom.shop.service.support.TextSupport;
import com.fpt.core.common.dto.PageResult;
import com.fpt.core.common.exception.BaseException;
import com.fpt.core.persistence.spec.SpecificationBuilder;
import com.fpt.core.persistence.util.PageableUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.fpt.core.persistence.spec.JpaFieldSpecifications.eq;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductQueryServiceImpl implements ProductQueryService {

    private static final int MAX_PAGE_SIZE = 100;
    private static final UUID NIL_UUID = new UUID(0L, 0L);
    private static final int MAX_KEYWORD_LENGTH = 200;
    private static final int FLASH_DEAL_CANDIDATES = 200;

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final ProductVariantRepository productVariantRepository;
    private final CategoryRepository categoryRepository;
    private final StoreRepository storeRepository;
    private final SearchLogRepository searchLogRepository;
    private final CategoryService categoryService;
    private final ShopMapper shopMapper;
    private final PromotionPricing promotionPricing;
    private final AccessSupport accessSupport;

    @Override
    @Transactional(readOnly = true)
    public HomeResponse home() {
        int size = ShopConstants.HOME_SECTION_SIZE;
        return new HomeResponse(
                categoryService.publicTree(),
                trending(null, size),
                bestSellers(null, size),
                shopMapper.toCards(productRepository.findAll(ProductSpecs.publiclyVisible(),
                        PageableUtils.pageable(0, size, "createdDate:DESC")).getContent()),
                flashDeals(size),
                trendingKeywords(size));
    }

    @Override
    @Transactional
    public PageResult<ProductCard> search(ProductSearchFilter filter) {
        Pageable pageable = PageableUtils.pageable(filter.getPageNumber() - 1,
                Math.min(filter.getPageSize(), MAX_PAGE_SIZE), sortExpression(filter.getSort()));
        Page<Product> page = productRepository.findAll(toSpec(filter), Objects.requireNonNull(pageable));
        logKeyword(filter.getKeyword());
        return new PageResult<>(shopMapper.toCards(page.getContent()), page.getTotalElements(),
                page.getTotalPages(), page.getNumber() + 1, page.getSize());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductCard> searchTop(ProductSearchFilter filter, int limit) {
        Pageable pageable = PageableUtils.pageable(0, clamp(limit), sortExpression(filter.getSort()));
        return shopMapper.toCards(productRepository.findAll(toSpec(filter), Objects.requireNonNull(pageable))
                .getContent());
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> suggest(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return List.of();
        }
        Specification<Product> spec = new SpecificationBuilder<Product>()
                .and(ProductSpecs.publiclyVisible())
                .and(ProductSpecs.keyword(keyword))
                .build();
        Pageable pageable = PageableUtils.pageable(0, ShopConstants.MAX_SUGGESTIONS * 3, "soldCount:DESC");
        return productRepository.findAll(spec, Objects.requireNonNull(pageable)).getContent().stream()
                .map(Product::getName).distinct().limit(ShopConstants.MAX_SUGGESTIONS).toList();
    }

    @Override
    @Transactional
    public ProductDetail detail(UUID id) {
        requireVisible(id);
        productRepository.incrementViewCount(id);
        Product product = productRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new BaseException("APP_DATA404"));
        Store store = storeRepository.findById(product.getStoreId())
                .orElseThrow(() -> new BaseException("APP_DATA404"));
        Category category = product.getCategoryId() != null
                ? categoryRepository.findById(product.getCategoryId()).orElse(null) : null;

        List<String> images = productImageRepository.findByProductIdOrderBySortOrderAsc(id).stream()
                .map(ProductImage::getUrl).toList();
        if (images.isEmpty() && product.getThumbnailUrl() != null) {
            images = List.of(product.getThumbnailUrl());
        }
        Prices prices = promotionPricing.load(List.of(id));
        Running promotion = prices.running(id);
        List<VariantResponse> variants = productVariantRepository.findByProductIdOrderByCreatedDateAsc(id)
                .stream().map(v -> new VariantResponse(v.getId(), v.getName(), prices.effective(id, v.getPrice()),
                        v.getStock(), v.getSku()))
                .toList();
        BigDecimal price = prices.effective(id, product.getPrice());
        BigDecimal originalPrice = promotion != null ? product.getPrice() : product.getOriginalPrice();
        int discountPercent = promotion != null ? promotion.percent()
                : TextSupport.discountPercent(product.getPrice(), product.getOriginalPrice());

        return new ProductDetail(product.getId(), product.getName(), product.getSlug(),
                product.getThumbnailUrl(), price, originalPrice, discountPercent,
                product.getRatingAvg(), product.getRatingCount(), product.getSoldCount(), store.getId(),
                store.getName(), store.getProvince(), product.getArType(), product.getDescription(),
                product.getStock(), product.getCategoryId(), category != null ? category.getName() : null,
                images, variants, TextSupport.splitCsv(product.getTags()), product.getArOverlayUrl(),
                product.getArScale(), product.getArOffsetY(), shopMapper.toStore(store),
                promotion != null ? promotion.name() : null, promotion != null ? promotion.endAt() : null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductCard> related(UUID id) {
        Product product = requireVisible(id);
        if (product.getCategoryId() == null) {
            return List.of();
        }
        Specification<Product> spec = new SpecificationBuilder<Product>()
                .and(ProductSpecs.publiclyVisible())
                .and(eq("categoryId", product.getCategoryId()))
                .build();
        Pageable pageable = PageableUtils.pageable(0, ShopConstants.MAX_RELATED + 1, "soldCount:DESC");
        List<Product> related = productRepository.findAll(spec, Objects.requireNonNull(pageable)).getContent()
                .stream().filter(p -> !p.getId().equals(id)).limit(ShopConstants.MAX_RELATED).toList();
        return shopMapper.toCards(related);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductCard> trending(UUID categoryId, int limit) {
        List<UUID> categoryIds = categoryId == null ? List.of(NIL_UUID)
                : categoryService.selfAndDescendantIds(categoryId);
        if (categoryIds.isEmpty()) {
            return List.of();
        }
        LocalDateTime since = LocalDateTime.now().minusDays(ShopConstants.TRENDING_WINDOW_DAYS);
        List<UUID> ids = productRepository.findTrendingIds(since, categoryId == null, categoryIds,
                clamp(limit));
        return cardsInOrder(ids);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductCard> bestSellers(UUID categoryId, int limit) {
        ProductSearchFilter filter = new ProductSearchFilter();
        filter.setCategoryId(categoryId);
        filter.setSort("best_selling");
        return searchTop(filter, limit);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductCard> flashDeals(int limit) {
        // Manual discounts and running promotions are mixed, so rank by the final percent on a bounded candidate set.
        List<Product> candidates = productRepository.findFlashDeals(ProductStatus.ACTIVE, ApprovalStatus.ACTIVE,
                LocalDateTime.now(), PageRequest.of(0, FLASH_DEAL_CANDIDATES));
        return shopMapper.toCards(candidates).stream()
                .filter(card -> card.discountPercent() > 0)
                .sorted(Comparator.comparingInt(ProductCard::discountPercent).reversed()
                        .thenComparing(Comparator.comparingInt(ProductCard::soldCount).reversed()))
                .limit(clamp(limit)).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> trendingKeywords(int limit) {
        return searchLogRepository.findTrendingKeywords(
                LocalDateTime.now().minusDays(ShopConstants.TRENDING_WINDOW_DAYS), clamp(limit));
    }

    private Specification<Product> toSpec(ProductSearchFilter filter) {
        List<UUID> categoryIds = null;
        if (filter.getCategoryId() != null) {
            categoryIds = categoryService.selfAndDescendantIds(filter.getCategoryId());
            if (categoryIds.isEmpty()) {
                categoryIds = List.of(NIL_UUID);
            }
        }
        return ProductSpecs.publicSearch(filter.getKeyword(), categoryIds, filter.getStoreId(),
                filter.getMinPrice(), filter.getMaxPrice(), filter.getMinRating());
    }

    private Product requireVisible(UUID id) {
        Product product = productRepository.findByIdAndIsDeletedFalse(Objects.requireNonNull(id))
                .orElseThrow(() -> new BaseException("APP_DATA404"));
        boolean storeActive = storeRepository.findByIdAndIsDeletedFalse(product.getStoreId())
                .map(s -> s.getStatus() == ApprovalStatus.ACTIVE).orElse(false);
        if (product.getStatus() != ProductStatus.ACTIVE || !storeActive) {
            throw new BaseException("APP_DATA404");
        }
        return product;
    }

    private List<ProductCard> cardsInOrder(Collection<UUID> ids) {
        if (ids.isEmpty()) {
            return List.of();
        }
        Map<UUID, Product> byId = productRepository.findByIdInAndIsDeletedFalse(ids).stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));
        List<Product> ordered = new ArrayList<>();
        ids.forEach(id -> {
            Product p = byId.get(id);
            if (p != null) {
                ordered.add(p);
            }
        });
        return shopMapper.toCards(ordered);
    }

    private void logKeyword(String keyword) {
        String normalized = keyword == null ? "" : keyword.trim().toLowerCase();
        if (normalized.isEmpty()) {
            return;
        }
        SearchLog entry = new SearchLog();
        entry.setKeyword(TextSupport.truncate(normalized, MAX_KEYWORD_LENGTH));
        entry.setUsername(accessSupport.optionalUsername());
        searchLogRepository.save(entry);
    }

    private static int clamp(int limit) {
        return Math.max(1, Math.min(limit, MAX_PAGE_SIZE));
    }

    private static String sortExpression(String sort) {
        String key = sort == null ? "relevance" : sort.trim().toLowerCase();
        return switch (key) {
            case "newest" -> "createdDate:DESC";
            case "price_asc" -> "price:ASC";
            case "price_desc" -> "price:DESC";
            case "best_selling" -> "soldCount:DESC,ratingAvg:DESC";
            case "popular" -> "viewCount:DESC";
            default -> "soldCount:DESC,ratingAvg:DESC,createdDate:DESC";
        };
    }
}
