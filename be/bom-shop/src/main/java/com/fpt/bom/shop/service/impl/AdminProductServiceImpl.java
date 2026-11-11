package com.fpt.bom.shop.service.impl;

import com.fpt.bom.shop.dto.AdminDto.AdminProductResponse;
import com.fpt.bom.shop.dto.CommonDto.ReasonRequest;
import com.fpt.bom.shop.dto.SellerDto.ProductFilter;
import com.fpt.bom.shop.dto.SellerDto.ProductResponse;
import com.fpt.bom.shop.entity.Product;
import com.fpt.bom.shop.entity.Store;
import com.fpt.bom.shop.enums.NotificationType;
import com.fpt.bom.shop.enums.ProductStatus;
import com.fpt.bom.shop.repository.ProductRepository;
import com.fpt.bom.shop.repository.StoreRepository;
import com.fpt.bom.shop.service.AdminProductService;
import com.fpt.bom.shop.service.CategoryService;
import com.fpt.bom.shop.service.support.NotificationSupport;
import com.fpt.bom.shop.service.support.ProductAssembler;
import com.fpt.bom.shop.service.support.ProductSpecs;
import com.fpt.bom.shop.service.support.TextSupport;
import com.fpt.core.common.dto.PageResult;
import com.fpt.core.common.exception.BaseException;
import com.fpt.core.persistence.spec.SpecificationBuilder;
import com.fpt.core.persistence.util.PageableUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

import static com.fpt.core.persistence.spec.JpaFieldSpecifications.eq;
import static com.fpt.core.persistence.spec.JpaFieldSpecifications.in;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminProductServiceImpl implements AdminProductService {

    private final ProductRepository productRepository;
    private final StoreRepository storeRepository;
    private final CategoryService categoryService;
    private final ProductAssembler productAssembler;
    private final NotificationSupport notificationSupport;

    @Override
    @Transactional(readOnly = true)
    public PageResult<AdminProductResponse> search(ProductFilter filter) {
        SpecificationBuilder<Product> builder = new SpecificationBuilder<>();
        builder.and(eq("isDeleted", false));
        builder.and(eq("status", filter.getStatus()));
        builder.and(eq("storeId", filter.getStoreId()));
        builder.and(ProductSpecs.keyword(filter.getKeyword()));
        if (filter.getCategoryId() != null) {
            List<UUID> ids = categoryService.selfAndDescendantIds(filter.getCategoryId());
            builder.and(in("categoryId", ids.isEmpty() ? List.of(new UUID(0L, 0L)) : ids));
        }
        Page<Product> page = productRepository.findAll(builder.build(),
                Objects.requireNonNull(PageableUtils.pageable(filter)));
        return new PageResult<>(productAssembler.toRows(page.getContent()), page.getTotalElements(),
                page.getTotalPages(), page.getNumber() + 1, page.getSize());
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse view(UUID id) {
        return productAssembler.toResponse(require(id));
    }

    @Override
    @Transactional
    public void ban(ReasonRequest request) {
        Product product = require(request.id());
        if (product.getStatus() == ProductStatus.BANNED) {
            throw new BaseException("shop.product.alreadyBanned");
        }
        product.setStatus(ProductStatus.BANNED);
        product.setBanReason(TextSupport.blankToNull(request.reason()));
        productRepository.save(product);
        productRepository.flush();
        storeRepository.refreshProductCount(product.getStoreId());
        notifySeller(product, "shop.notify.product.banned", product.getBanReason());
        log.info("Product banned: id={}", product.getId());
    }

    @Override
    @Transactional
    public void unban(ReasonRequest request) {
        Product product = require(request.id());
        if (product.getStatus() != ProductStatus.BANNED) {
            throw new BaseException("shop.product.notBanned");
        }
        product.setStatus(ProductStatus.HIDDEN);
        product.setBanReason(null);
        productRepository.save(product);
        notifySeller(product, "shop.notify.product.unbanned", null);
        log.info("Product unbanned: id={}", product.getId());
    }

    private Product require(UUID id) {
        return productRepository.findByIdAndIsDeletedFalse(Objects.requireNonNull(id))
                .orElseThrow(() -> new BaseException("APP_DATA404"));
    }

    private void notifySeller(Product product, String titleKey, String content) {
        storeRepository.findById(product.getStoreId()).map(Store::getOwnerUsername).ifPresent(owner ->
                notificationSupport.send(owner, NotificationType.SYSTEM, titleKey, content, "/seller/products",
                        product.getName()));
    }
}
