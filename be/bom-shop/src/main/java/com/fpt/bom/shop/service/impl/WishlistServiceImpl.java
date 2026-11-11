package com.fpt.bom.shop.service.impl;

import com.fpt.bom.shop.dto.CartDto.WishlistToggleResponse;
import com.fpt.bom.shop.dto.CatalogDto.ProductCard;
import com.fpt.bom.shop.entity.Product;
import com.fpt.bom.shop.entity.Wishlist;
import com.fpt.bom.shop.enums.ApprovalStatus;
import com.fpt.bom.shop.enums.ProductStatus;
import com.fpt.bom.shop.repository.ProductRepository;
import com.fpt.bom.shop.repository.StoreRepository;
import com.fpt.bom.shop.repository.WishlistRepository;
import com.fpt.bom.shop.service.WishlistService;
import com.fpt.bom.shop.service.support.AccessSupport;
import com.fpt.bom.shop.service.support.ProductSpecs;
import com.fpt.bom.shop.service.support.ShopMapper;
import com.fpt.core.common.exception.BaseException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WishlistServiceImpl implements WishlistService {

    private final WishlistRepository wishlistRepository;
    private final ProductRepository productRepository;
    private final StoreRepository storeRepository;
    private final AccessSupport accessSupport;
    private final ShopMapper shopMapper;

    @Override
    @Transactional(readOnly = true)
    public List<ProductCard> list() {
        List<Wishlist> entries = wishlistRepository
                .findByUsernameOrderByCreatedDateDesc(accessSupport.currentUsername());
        if (entries.isEmpty()) {
            return List.of();
        }
        List<UUID> ids = entries.stream().map(Wishlist::getProductId).toList();
        // Re-apply the storefront visibility rule so hidden/banned products drop out of the list.
        Map<UUID, Product> visible = productRepository.findAll(
                        new com.fpt.core.persistence.spec.SpecificationBuilder<Product>()
                                .and(ProductSpecs.publiclyVisible())
                                .and(com.fpt.core.persistence.spec.JpaFieldSpecifications.in("id", ids))
                                .build())
                .stream().collect(Collectors.toMap(Product::getId, Function.identity()));
        List<Product> ordered = ids.stream().map(visible::get).filter(Objects::nonNull).toList();
        return shopMapper.toCards(ordered);
    }

    @Override
    @Transactional
    public WishlistToggleResponse toggle(UUID productId) {
        String username = accessSupport.currentUsername();
        Optional<Wishlist> existing = wishlistRepository.findByUsernameAndProductId(username,
                Objects.requireNonNull(productId));
        if (existing.isPresent()) {
            wishlistRepository.delete(existing.get());
            return new WishlistToggleResponse(false);
        }
        Product product = productRepository.findByIdAndIsDeletedFalse(productId)
                .orElseThrow(() -> new BaseException("shop.product.unavailable"));
        boolean storeActive = storeRepository.findByIdAndIsDeletedFalse(product.getStoreId())
                .map(s -> s.getStatus() == ApprovalStatus.ACTIVE).orElse(false);
        if (product.getStatus() != ProductStatus.ACTIVE || !storeActive) {
            throw new BaseException("shop.product.unavailable");
        }
        Wishlist entry = new Wishlist();
        entry.setUsername(username);
        entry.setProductId(productId);
        wishlistRepository.save(entry);
        log.info("Wishlist add: user={}, product={}", username, productId);
        return new WishlistToggleResponse(true);
    }
}
