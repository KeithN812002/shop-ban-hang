package com.fpt.bom.shop.service.support;

import com.fpt.bom.shop.dto.CartDto.AddressResponse;
import com.fpt.bom.shop.dto.CatalogDto.ProductCard;
import com.fpt.bom.shop.dto.CatalogDto.StoreResponse;
import com.fpt.bom.shop.dto.VoucherDto.VoucherResponse;
import com.fpt.bom.shop.entity.Address;
import com.fpt.bom.shop.entity.Product;
import com.fpt.bom.shop.entity.Store;
import com.fpt.bom.shop.entity.Voucher;
import com.fpt.bom.shop.repository.StoreRepository;
import com.fpt.bom.shop.service.support.PromotionPricing.Prices;
import com.fpt.bom.shop.service.support.PromotionPricing.Running;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Entity -> DTO conversions shared by several services. */
@Component
@RequiredArgsConstructor
public class ShopMapper {

    private final StoreRepository storeRepository;
    private final PromotionPricing promotionPricing;

    public List<ProductCard> toCards(Collection<Product> products) {
        if (products.isEmpty()) {
            return List.of();
        }
        Map<java.util.UUID, Store> stores = storeRepository
                .findAllById(products.stream().map(Product::getStoreId).distinct().toList()).stream()
                .collect(Collectors.toMap(Store::getId, Function.identity()));
        Prices prices = promotionPricing.load(products.stream().map(Product::getId).toList());
        return products.stream().map(p -> toCard(p, stores.get(p.getStoreId()), prices.running(p.getId())))
                .toList();
    }

    /** With a running promotion the card shows the effective price against the base price as "original". */
    private ProductCard toCard(Product p, Store store, Running promotion) {
        BigDecimal price = p.getPrice();
        BigDecimal originalPrice = p.getOriginalPrice();
        int percent = TextSupport.discountPercent(price, originalPrice);
        if (promotion != null) {
            price = PromotionPricing.applyPercent(p.getPrice(), promotion.percent());
            originalPrice = p.getPrice();
            percent = promotion.percent();
        }
        return new ProductCard(p.getId(), p.getName(), p.getSlug(), p.getThumbnailUrl(), price, originalPrice,
                percent, p.getRatingAvg(), p.getRatingCount(), p.getSoldCount(), p.getStoreId(),
                store != null ? store.getName() : null, store != null ? store.getProvince() : null, p.getArType(),
                promotion != null ? promotion.name() : null, promotion != null ? promotion.endAt() : null);
    }

    public StoreResponse toStore(Store s) {
        return new StoreResponse(s.getId(), s.getName(), s.getSlug(), s.getDescription(), s.getLogoUrl(),
                s.getBannerUrl(), s.getProvince(), s.getRatingAvg(), s.getRatingCount(), s.getProductCount(),
                s.getFollowerCount(), s.getCreatedDate());
    }

    public VoucherResponse toVoucher(Voucher v) {
        return new VoucherResponse(v.getId(), v.getStoreId(), v.getCode(), v.getName(), v.getDiscountType(),
                v.getDiscountValue(), v.getMaxDiscount(), v.getMinOrderValue(), v.getStartAt(), v.getEndAt(),
                v.getUsageLimit(), v.getUsedCount(), v.getPerUserLimit(), v.getStatus());
    }

    public AddressResponse toAddress(Address a) {
        return new AddressResponse(a.getId(), a.getReceiverName(), a.getPhone(), a.getProvince(),
                a.getDistrict(), a.getWard(), a.getDetail(), a.isDefaultAddress());
    }
}
