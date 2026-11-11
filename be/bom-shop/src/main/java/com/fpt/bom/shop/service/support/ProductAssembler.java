package com.fpt.bom.shop.service.support;

import com.fpt.bom.shop.dto.AdminDto.AdminProductResponse;
import com.fpt.bom.shop.dto.CatalogDto.ProductCard;
import com.fpt.bom.shop.dto.CatalogDto.VariantResponse;
import com.fpt.bom.shop.dto.SellerDto.ProductResponse;
import com.fpt.bom.shop.entity.Category;
import com.fpt.bom.shop.entity.Product;
import com.fpt.bom.shop.entity.ProductImage;
import com.fpt.bom.shop.entity.ProductVariant;
import com.fpt.bom.shop.entity.Store;
import com.fpt.bom.shop.repository.CategoryRepository;
import com.fpt.bom.shop.repository.ProductImageRepository;
import com.fpt.bom.shop.repository.ProductVariantRepository;
import com.fpt.bom.shop.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Builds the full seller/admin product view (images, variants, names) in a few batched queries. */
@Component
@RequiredArgsConstructor
public class ProductAssembler {

    private final ProductImageRepository productImageRepository;
    private final ProductVariantRepository productVariantRepository;
    private final CategoryRepository categoryRepository;
    private final StoreRepository storeRepository;
    private final ShopMapper shopMapper;

    public List<ProductResponse> toResponses(Collection<Product> products) {
        if (products.isEmpty()) {
            return List.of();
        }
        List<UUID> productIds = products.stream().map(Product::getId).toList();
        Map<UUID, List<String>> images = productImageRepository.findByProductIdInOrderBySortOrderAsc(productIds)
                .stream().collect(Collectors.groupingBy(ProductImage::getProductId,
                        Collectors.mapping(ProductImage::getUrl, Collectors.toList())));
        Map<UUID, List<ProductVariant>> variants = productVariantRepository.findByProductIdIn(productIds)
                .stream().collect(Collectors.groupingBy(ProductVariant::getProductId));
        Map<UUID, Category> categories = categoryRepository
                .findAllById(products.stream().map(Product::getCategoryId).filter(java.util.Objects::nonNull)
                        .distinct().toList())
                .stream().collect(Collectors.toMap(Category::getId, Function.identity()));
        Map<UUID, Store> stores = storeRepository
                .findAllById(products.stream().map(Product::getStoreId).distinct().toList()).stream()
                .collect(Collectors.toMap(Store::getId, Function.identity()));

        return products.stream().map(p -> {
            Category category = p.getCategoryId() != null ? categories.get(p.getCategoryId()) : null;
            Store store = stores.get(p.getStoreId());
            List<VariantResponse> variantResponses = variants.getOrDefault(p.getId(), List.of()).stream()
                    .sorted(Comparator.comparing(ProductVariant::getCreatedDate,
                            Comparator.nullsLast(Comparator.naturalOrder())))
                    .map(v -> new VariantResponse(v.getId(), v.getName(), v.getPrice(), v.getStock(), v.getSku()))
                    .toList();
            return new ProductResponse(p.getId(), p.getStoreId(), store != null ? store.getName() : null,
                    p.getCategoryId(), category != null ? category.getName() : null, p.getName(), p.getSlug(),
                    p.getDescription(), p.getPrice(), p.getOriginalPrice(), p.getStock(), p.getSoldCount(),
                    p.getViewCount(), p.getRatingAvg(), p.getRatingCount(), p.getThumbnailUrl(),
                    images.getOrDefault(p.getId(), List.of()), variantResponses, TextSupport.splitCsv(p.getTags()),
                    p.getStatus(),
                    p.getBanReason(), p.getArType(), p.getArOverlayUrl(), p.getArScale(), p.getArOffsetY(),
                    p.getCreatedDate());
        }).toList();
    }

    /**
     * List rows for the seller and admin product tables: the product card plus moderation fields. Prices are the
     * stored (base) prices, not the promotion price, because the seller edits these.
     */
    public List<AdminProductResponse> toRows(List<Product> products) {
        List<ProductCard> cards = shopMapper.toCards(products);
        List<AdminProductResponse> rows = new java.util.ArrayList<>();
        for (int i = 0; i < products.size(); i++) {
            Product p = products.get(i);
            ProductCard c = cards.get(i);
            rows.add(new AdminProductResponse(p.getId(), p.getName(), p.getSlug(), p.getThumbnailUrl(),
                    p.getPrice(), p.getOriginalPrice(),
                    TextSupport.discountPercent(p.getPrice(), p.getOriginalPrice()), p.getRatingAvg(),
                    p.getRatingCount(), p.getSoldCount(), p.getStoreId(), c.storeName(), c.province(),
                    p.getArType(), p.getStatus(), p.getBanReason(), p.getStock(), p.getCreatedDate()));
        }
        return rows;
    }

    public ProductResponse toResponse(Product product) {
        return toResponses(List.of(product)).get(0);
    }
}
