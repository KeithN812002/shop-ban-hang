package com.fpt.bom.shop.service.impl;

import com.fpt.bom.shop.dto.AdminDto.AdminProductResponse;
import com.fpt.bom.shop.dto.SellerDto.ProductFilter;
import com.fpt.bom.shop.dto.SellerDto.ProductRequest;
import com.fpt.bom.shop.dto.SellerDto.ProductResponse;
import com.fpt.bom.shop.dto.SellerDto.VariantRequest;
import com.fpt.bom.shop.entity.Category;
import com.fpt.bom.shop.entity.Product;
import com.fpt.bom.shop.entity.ProductImage;
import com.fpt.bom.shop.entity.ProductVariant;
import com.fpt.bom.shop.entity.Store;
import com.fpt.bom.shop.enums.ArType;
import com.fpt.bom.shop.enums.ProductStatus;
import com.fpt.bom.shop.repository.CategoryRepository;
import com.fpt.bom.shop.repository.ProductImageRepository;
import com.fpt.bom.shop.repository.ProductRepository;
import com.fpt.bom.shop.repository.ProductVariantRepository;
import com.fpt.bom.shop.repository.StoreRepository;
import com.fpt.bom.shop.service.CategoryService;
import com.fpt.bom.shop.service.SellerProductService;
import com.fpt.bom.shop.service.support.AccessSupport;
import com.fpt.bom.shop.service.support.ProductAssembler;
import com.fpt.bom.shop.service.support.ProductSpecs;
import com.fpt.bom.shop.service.support.TextSupport;
import com.fpt.core.common.dto.PageResult;
import com.fpt.core.common.enums.StatusBasic;
import com.fpt.core.common.exception.BaseException;
import com.fpt.core.persistence.spec.SpecificationBuilder;
import com.fpt.core.persistence.util.PageableUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.fpt.core.persistence.spec.JpaFieldSpecifications.eq;
import static com.fpt.core.persistence.spec.JpaFieldSpecifications.in;

@Slf4j
@Service
@RequiredArgsConstructor
public class SellerProductServiceImpl implements SellerProductService {

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final ProductVariantRepository productVariantRepository;
    private final CategoryRepository categoryRepository;
    private final StoreRepository storeRepository;
    private final CategoryService categoryService;
    private final AccessSupport accessSupport;
    private final ProductAssembler productAssembler;

    @Override
    @Transactional(readOnly = true)
    public PageResult<AdminProductResponse> search(ProductFilter filter) {
        Store store = accessSupport.requireActiveStore(accessSupport.currentUsername());
        Page<Product> page = productRepository.findAll(buildSpec(store.getId(), filter),
                Objects.requireNonNull(pageable(filter)));
        return new PageResult<>(productAssembler.toRows(page.getContent()), page.getTotalElements(),
                page.getTotalPages(), page.getNumber() + 1, page.getSize());
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse view(UUID id) {
        Store store = accessSupport.requireActiveStore(accessSupport.currentUsername());
        return productAssembler.toResponse(requireOwned(id, store));
    }

    @Override
    @Transactional
    public ProductResponse create(ProductRequest request) {
        Store store = accessSupport.requireActiveStore(accessSupport.currentUsername());
        validate(request);
        Product product = new Product();
        product.setStoreId(store.getId());
        product.setSlug(TextSupport.slugWithSuffix(request.name(), 60));
        apply(product, request);
        productRepository.save(product);
        replaceImages(product, request.images());
        syncVariants(product, request.variants());
        finish(store);
        log.info("Seller created product: id={}, store={}", product.getId(), store.getId());
        return productAssembler.toResponse(reload(product.getId()));
    }

    @Override
    @Transactional
    public ProductResponse update(ProductRequest request) {
        Store store = accessSupport.requireActiveStore(accessSupport.currentUsername());
        Product product = requireOwned(request.id(), store);
        if (product.getStatus() == ProductStatus.BANNED) {
            throw new BaseException("shop.product.banned");
        }
        validate(request);
        if (!product.getName().equals(request.name().trim())) {
            product.setSlug(TextSupport.slugWithSuffix(request.name(), 60));
        }
        apply(product, request);
        productRepository.save(product);
        replaceImages(product, request.images());
        syncVariants(product, request.variants());
        finish(store);
        log.info("Seller updated product: id={}", product.getId());
        return productAssembler.toResponse(reload(product.getId()));
    }

    @Override
    @Transactional
    public void delete(List<UUID> ids) {
        Store store = accessSupport.requireActiveStore(accessSupport.currentUsername());
        List<UUID> distinct = ids.stream().distinct().toList();
        List<Product> products = productRepository.findByIdInAndIsDeletedFalse(distinct);
        if (products.size() != distinct.size()
                || products.stream().anyMatch(p -> !p.getStoreId().equals(store.getId()))) {
            throw new BaseException("APP_DATA404");
        }
        String actor = accessSupport.currentUsername();
        LocalDateTime now = LocalDateTime.now();
        products.forEach(p -> {
            p.setDeleted(true);
            p.setDeletedDate(now);
            p.setDeletedBy(actor);
        });
        productRepository.saveAll(products);
        productRepository.flush();
        storeRepository.refreshProductCount(store.getId());
        log.info("Seller deleted products: store={}, count={}", store.getId(), products.size());
    }

    private void validate(ProductRequest request) {
        if (request.status() == ProductStatus.BANNED) {
            throw new BaseException("shop.product.statusInvalid");
        }
        Category category = categoryRepository.findById(Objects.requireNonNull(request.categoryId()))
                .orElseThrow(() -> new BaseException("shop.product.categoryInvalid"));
        if (category.getStatus() != StatusBasic.ACTIVE) {
            throw new BaseException("shop.product.categoryInvalid");
        }
        if (request.originalPrice() != null && request.originalPrice().compareTo(request.price()) < 0) {
            throw new BaseException("shop.product.priceInvalid");
        }
        ArType arType = request.arType() != null ? request.arType() : ArType.NONE;
        if (arType != ArType.NONE && TextSupport.blankToNull(request.arOverlayUrl()) == null) {
            throw new BaseException("shop.product.arOverlayRequired");
        }
        if (request.variants() != null) {
            Set<String> names = new HashSet<>();
            for (VariantRequest variant : request.variants()) {
                if (!names.add(variant.name().trim().toLowerCase())) {
                    throw new BaseException("shop.product.variantDuplicate");
                }
            }
        }
    }

    private void apply(Product product, ProductRequest request) {
        product.setCategoryId(request.categoryId());
        product.setName(request.name().trim());
        product.setDescription(TextSupport.blankToNull(request.description()));
        product.setPrice(request.price());
        product.setOriginalPrice(request.originalPrice());
        product.setStock(request.stock());
        product.setThumbnailUrl(TextSupport.fileUrl(request.images().get(0)));
        List<String> tags = request.tags() == null ? List.of() : request.tags().stream()
                .map(t -> t == null ? "" : t.replace(',', ' ').trim()).filter(t -> !t.isEmpty()).distinct().toList();
        product.setTags(TextSupport.truncate(TextSupport.joinCsv(tags), 500));
        product.setStatus(request.status());
        ArType arType = request.arType() != null ? request.arType() : ArType.NONE;
        product.setArType(arType);
        product.setArOverlayUrl(arType == ArType.NONE ? null : TextSupport.fileUrl(request.arOverlayUrl()));
        product.setArScale(request.arScale() != null ? request.arScale() : 1.0);
        product.setArOffsetY(request.arOffsetY() != null ? request.arOffsetY() : 0.0);
    }

    private void replaceImages(Product product, List<String> urls) {
        productImageRepository.deleteByProductId(product.getId());
        productImageRepository.flush();
        List<ProductImage> images = new ArrayList<>();
        for (int i = 0; i < urls.size(); i++) {
            ProductImage image = new ProductImage();
            image.setProductId(product.getId());
            image.setUrl(TextSupport.fileUrl(urls.get(i)));
            image.setSortOrder(i);
            images.add(image);
        }
        productImageRepository.saveAll(images);
    }

    /** Creates/updates/removes variants; with variants the product price is the lowest one and stock the sum. */
    private void syncVariants(Product product, List<VariantRequest> requested) {
        List<VariantRequest> requests = requested == null ? List.of() : requested;
        Map<UUID, ProductVariant> existing = productVariantRepository
                .findByProductIdOrderByCreatedDateAsc(product.getId()).stream()
                .collect(Collectors.toMap(ProductVariant::getId, Function.identity()));

        Set<UUID> kept = new HashSet<>();
        List<ProductVariant> toSave = new ArrayList<>();
        for (VariantRequest request : requests) {
            ProductVariant variant;
            if (request.id() != null) {
                variant = existing.get(request.id());
                if (variant == null) {
                    throw new BaseException("APP_DATA404");
                }
                kept.add(variant.getId());
            } else {
                variant = new ProductVariant();
                variant.setProductId(product.getId());
            }
            variant.setName(request.name().trim());
            variant.setPrice(request.price());
            variant.setStock(request.stock());
            variant.setSku(TextSupport.blankToNull(request.sku()));
            toSave.add(variant);
        }
        List<ProductVariant> removed = existing.values().stream().filter(v -> !kept.contains(v.getId())).toList();
        if (!removed.isEmpty()) {
            productVariantRepository.deleteAll(removed);
        }
        productVariantRepository.saveAll(toSave);

        if (!toSave.isEmpty()) {
            product.setPrice(toSave.stream().map(ProductVariant::getPrice).min(BigDecimal::compareTo)
                    .orElse(product.getPrice()));
            product.setStock(toSave.stream().mapToInt(ProductVariant::getStock).sum());
            if (product.getOriginalPrice() != null && product.getOriginalPrice().compareTo(product.getPrice()) < 0) {
                product.setOriginalPrice(null);
            }
            productRepository.save(product);
        }
    }

    private void finish(Store store) {
        productRepository.flush();
        storeRepository.refreshProductCount(store.getId());
    }

    private Product reload(UUID id) {
        return productRepository.findByIdAndIsDeletedFalse(id).orElseThrow(() -> new BaseException("APP_DATA404"));
    }

    private Product requireOwned(UUID id, Store store) {
        return productRepository.findByIdAndStoreIdAndIsDeletedFalse(Objects.requireNonNull(id), store.getId())
                .orElseThrow(() -> new BaseException("APP_DATA404"));
    }

    private Pageable pageable(ProductFilter filter) {
        return PageableUtils.pageable(filter);
    }

    private Specification<Product> buildSpec(UUID storeId, ProductFilter filter) {
        SpecificationBuilder<Product> builder = new SpecificationBuilder<>();
        builder.and(eq("storeId", storeId));
        builder.and(eq("isDeleted", false));
        builder.and(eq("status", filter.getStatus()));
        builder.and(ProductSpecs.keyword(filter.getKeyword()));
        if (filter.getCategoryId() != null) {
            List<UUID> ids = categoryService.selfAndDescendantIds(filter.getCategoryId());
            builder.and(in("categoryId", ids.isEmpty() ? List.of(new UUID(0L, 0L)) : ids));
        }
        return builder.build();
    }
}
