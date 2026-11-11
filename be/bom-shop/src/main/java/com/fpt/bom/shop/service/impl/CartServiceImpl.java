package com.fpt.bom.shop.service.impl;

import com.fpt.bom.shop.dto.CartDto.CartAddRequest;
import com.fpt.bom.shop.dto.CartDto.CartGroup;
import com.fpt.bom.shop.dto.CartDto.CartLine;
import com.fpt.bom.shop.dto.CartDto.CartResponse;
import com.fpt.bom.shop.dto.CartDto.CartUpdateRequest;
import com.fpt.bom.shop.dto.CommonDto.StoreRef;
import com.fpt.bom.shop.dto.OrderDto.BuyNowRequest;
import com.fpt.bom.shop.entity.CartItem;
import com.fpt.bom.shop.entity.Product;
import com.fpt.bom.shop.entity.ProductVariant;
import com.fpt.bom.shop.entity.Store;
import com.fpt.bom.shop.enums.ApprovalStatus;
import com.fpt.bom.shop.enums.ProductStatus;
import com.fpt.bom.shop.repository.CartItemRepository;
import com.fpt.bom.shop.repository.ProductRepository;
import com.fpt.bom.shop.repository.ProductVariantRepository;
import com.fpt.bom.shop.repository.StoreRepository;
import com.fpt.bom.shop.service.CartService;
import com.fpt.bom.shop.service.support.AccessSupport;
import com.fpt.bom.shop.service.support.PromotionPricing;
import com.fpt.bom.shop.service.support.PromotionPricing.Prices;
import com.fpt.core.common.exception.BaseException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
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
public class CartServiceImpl implements CartService {

    private static final int MAX_LINE_QUANTITY = 999;

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final StoreRepository storeRepository;
    private final PromotionPricing promotionPricing;
    private final AccessSupport accessSupport;

    @Override
    @Transactional(readOnly = true)
    public CartResponse cart() {
        String username = accessSupport.currentUsername();
        List<CartItem> items = cartItemRepository.findByUsernameOrderByCreatedDateDesc(username);
        if (items.isEmpty()) {
            return new CartResponse(List.of());
        }
        Map<UUID, Product> products = productRepository
                .findAllById(items.stream().map(CartItem::getProductId).distinct().toList()).stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));
        Map<UUID, ProductVariant> variants = productVariantRepository
                .findAllById(items.stream().map(CartItem::getVariantId).filter(Objects::nonNull).distinct()
                        .toList())
                .stream().collect(Collectors.toMap(ProductVariant::getId, Function.identity()));
        Map<UUID, Store> stores = storeRepository
                .findAllById(products.values().stream().map(Product::getStoreId).distinct().toList()).stream()
                .collect(Collectors.toMap(Store::getId, Function.identity()));

        Prices prices = promotionPricing.load(products.keySet());

        Map<UUID, List<CartLine>> grouped = new LinkedHashMap<>();
        for (CartItem item : items) {
            Product product = products.get(item.getProductId());
            if (product == null) {
                continue;
            }
            ProductVariant variant = item.getVariantId() != null ? variants.get(item.getVariantId()) : null;
            Store store = stores.get(product.getStoreId());
            int stock = variant != null ? variant.getStock() : product.getStock();
            boolean purchasable = !product.isDeleted() && product.getStatus() == ProductStatus.ACTIVE
                    && store != null && !store.isDeleted() && store.getStatus() == ApprovalStatus.ACTIVE
                    && (item.getVariantId() == null || variant != null);
            grouped.computeIfAbsent(product.getStoreId(), k -> new ArrayList<>()).add(new CartLine(
                    item.getId(), product.getId(), item.getVariantId(), product.getName(),
                    variant != null ? variant.getName() : null, product.getThumbnailUrl(),
                    prices.effective(product.getId(), variant != null ? variant.getPrice() : product.getPrice()),
                    item.getQuantity(), stock,
                    item.isSelected(), purchasable && stock >= item.getQuantity()));
        }
        List<CartGroup> groups = grouped.entrySet().stream().map(e -> {
            Store store = stores.get(e.getKey());
            return new CartGroup(new StoreRef(e.getKey(), store != null ? store.getName() : null), e.getValue());
        }).toList();
        return new CartResponse(groups);
    }

    @Override
    @Transactional
    public void add(CartAddRequest request) {
        String username = accessSupport.currentUsername();
        Resolved resolved = resolve(request.productId(), request.variantId());
        CartItem item = findLine(username, request.productId(), request.variantId()).orElseGet(() -> {
            CartItem fresh = new CartItem();
            fresh.setUsername(username);
            fresh.setProductId(request.productId());
            fresh.setVariantId(request.variantId());
            fresh.setQuantity(0);
            return fresh;
        });
        int quantity = Math.min(item.getQuantity() + request.quantity(), MAX_LINE_QUANTITY);
        requireStock(resolved, quantity);
        item.setQuantity(quantity);
        item.setSelected(true);
        cartItemRepository.save(item);
        log.info("Cart add: user={}, product={}, quantity={}", username, request.productId(), quantity);
    }

    @Override
    @Transactional
    public void update(CartUpdateRequest request) {
        String username = accessSupport.currentUsername();
        CartItem item = cartItemRepository.findByIdAndUsername(Objects.requireNonNull(request.id()), username)
                .orElseThrow(() -> new BaseException("APP_DATA404"));
        if (request.quantity() != null) {
            requireStock(resolve(item.getProductId(), item.getVariantId()), request.quantity());
            item.setQuantity(request.quantity());
        }
        if (request.selected() != null) {
            item.setSelected(request.selected());
        }
        cartItemRepository.save(item);
    }

    @Override
    @Transactional
    public void delete(List<UUID> ids) {
        String username = accessSupport.currentUsername();
        List<CartItem> items = cartItemRepository.findByUsernameAndIdIn(username, ids);
        cartItemRepository.deleteAll(items);
        log.info("Cart delete: user={}, count={}", username, items.size());
    }

    @Override
    @Transactional
    public void buyNow(BuyNowRequest request) {
        String username = accessSupport.currentUsername();
        Resolved resolved = resolve(request.productId(), request.variantId());
        requireStock(resolved, request.quantity());

        List<CartItem> all = cartItemRepository.findByUsername(username);
        CartItem target = null;
        for (CartItem item : all) {
            boolean same = item.getProductId().equals(request.productId())
                    && Objects.equals(item.getVariantId(), request.variantId());
            if (same) {
                target = item;
            } else if (item.isSelected()) {
                item.setSelected(false);
            }
        }
        if (target == null) {
            target = new CartItem();
            target.setUsername(username);
            target.setProductId(request.productId());
            target.setVariantId(request.variantId());
            all.add(target);
        }
        target.setQuantity(request.quantity());
        target.setSelected(true);
        cartItemRepository.saveAll(all);
        log.info("Buy now: user={}, product={}", username, request.productId());
    }

    private Optional<CartItem> findLine(String username, UUID productId, UUID variantId) {
        return variantId == null
                ? cartItemRepository.findByUsernameAndProductIdAndVariantIdIsNull(username, productId)
                : cartItemRepository.findByUsernameAndProductIdAndVariantId(username, productId, variantId);
    }

    /** Validates that the product (and variant) can be bought right now and returns its stock holder. */
    private Resolved resolve(UUID productId, UUID variantId) {
        Product product = productRepository.findByIdAndIsDeletedFalse(Objects.requireNonNull(productId))
                .orElseThrow(() -> new BaseException("shop.product.unavailable"));
        boolean storeActive = storeRepository.findByIdAndIsDeletedFalse(product.getStoreId())
                .map(s -> s.getStatus() == ApprovalStatus.ACTIVE).orElse(false);
        if (product.getStatus() != ProductStatus.ACTIVE || !storeActive) {
            throw new BaseException("shop.product.unavailable");
        }
        List<ProductVariant> variants = productVariantRepository.findByProductIdOrderByCreatedDateAsc(productId);
        if (variants.isEmpty()) {
            if (variantId != null) {
                throw new BaseException("shop.cart.variantInvalid");
            }
            return new Resolved(product, null);
        }
        if (variantId == null) {
            throw new BaseException("shop.cart.variantRequired");
        }
        ProductVariant variant = variants.stream().filter(v -> v.getId().equals(variantId)).findFirst()
                .orElseThrow(() -> new BaseException("shop.cart.variantInvalid"));
        return new Resolved(product, variant);
    }

    private void requireStock(Resolved resolved, int quantity) {
        int stock = resolved.variant() != null ? resolved.variant().getStock() : resolved.product().getStock();
        if (quantity > stock) {
            throw new BaseException("shop.stock.insufficient", resolved.product().getName());
        }
    }

    private record Resolved(Product product, ProductVariant variant) {
    }
}
