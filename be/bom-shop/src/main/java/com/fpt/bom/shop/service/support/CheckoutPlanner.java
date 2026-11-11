package com.fpt.bom.shop.service.support;

import com.fpt.bom.shop.config.ShopProperties;
import com.fpt.bom.shop.dto.OrderDto.CheckoutRequest;
import com.fpt.bom.shop.entity.Address;
import com.fpt.bom.shop.entity.CartItem;
import com.fpt.bom.shop.entity.Product;
import com.fpt.bom.shop.entity.ProductVariant;
import com.fpt.bom.shop.entity.Store;
import com.fpt.bom.shop.entity.Voucher;
import com.fpt.bom.shop.enums.ApprovalStatus;
import com.fpt.bom.shop.enums.ProductStatus;
import com.fpt.bom.shop.repository.AddressRepository;
import com.fpt.bom.shop.repository.CartItemRepository;
import com.fpt.bom.shop.repository.ProductRepository;
import com.fpt.bom.shop.repository.ProductVariantRepository;
import com.fpt.bom.shop.repository.StoreRepository;
import com.fpt.core.common.exception.BaseException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Turns the buyer's selected cart lines into per-store order drafts: validates products and stock, applies the
 * shipping rule and the store/platform vouchers. Pure calculation, no writes — shared by preview and create.
 */
@Component
@RequiredArgsConstructor
public class CheckoutPlanner {

    public record PlanItem(UUID cartItemId, Product product, ProductVariant variant, int quantity,
            BigDecimal unitPrice) {
        public BigDecimal lineTotal() {
            return unitPrice.multiply(BigDecimal.valueOf(quantity));
        }
    }

    /** One future order. */
    public record StorePlan(Store store, List<PlanItem> items, BigDecimal subtotal, BigDecimal shippingFee,
            Voucher storeVoucher, BigDecimal storeDiscount, BigDecimal platformDiscount) {
        public BigDecimal total() {
            return subtotal.add(shippingFee).subtract(storeDiscount).subtract(platformDiscount);
        }

        StorePlan withPlatformDiscount(BigDecimal discount) {
            return new StorePlan(store, items, subtotal, shippingFee, storeVoucher, storeDiscount, discount);
        }
    }

    public record Plan(Address address, List<StorePlan> stores, Voucher platformVoucher,
            BigDecimal platformDiscount, BigDecimal total, List<CartItem> cartItems) {
    }

    private final CartItemRepository cartItemRepository;
    private final AddressRepository addressRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final StoreRepository storeRepository;
    private final PromotionPricing promotionPricing;
    private final VoucherSupport voucherSupport;
    private final ShopProperties shopProperties;

    public Plan plan(String username, CheckoutRequest request) {
        List<CartItem> cartItems = cartItemRepository.findByUsernameAndSelectedTrueOrderByCreatedDateAsc(username);
        if (cartItems.isEmpty()) {
            throw new BaseException("shop.cart.empty");
        }
        Address address = addressRepository.findByIdAndUsername(Objects.requireNonNull(request.addressId()), username)
                .orElseThrow(() -> new BaseException("shop.address.notFound"));

        Map<UUID, Product> products = productRepository
                .findByIdInAndIsDeletedFalse(cartItems.stream().map(CartItem::getProductId).distinct().toList())
                .stream().collect(Collectors.toMap(Product::getId, Function.identity()));
        Map<UUID, Store> stores = storeRepository
                .findByIdInAndIsDeletedFalse(products.values().stream().map(Product::getStoreId).distinct().toList())
                .stream().collect(Collectors.toMap(Store::getId, Function.identity()));
        Map<UUID, List<ProductVariant>> variantsByProduct = productVariantRepository
                .findByProductIdIn(products.keySet()).stream()
                .collect(Collectors.groupingBy(ProductVariant::getProductId));

        PromotionPricing.Prices prices = promotionPricing.load(products.keySet());

        Map<UUID, List<PlanItem>> itemsByStore = new LinkedHashMap<>();
        for (CartItem cartItem : cartItems) {
            Product product = products.get(cartItem.getProductId());
            if (product == null) {
                throw new BaseException("shop.checkout.itemUnavailable", "?");
            }
            Store store = stores.get(product.getStoreId());
            if (product.getStatus() != ProductStatus.ACTIVE || store == null
                    || store.getStatus() != ApprovalStatus.ACTIVE) {
                throw new BaseException("shop.checkout.itemUnavailable", product.getName());
            }
            ProductVariant variant = resolveVariant(product, cartItem, variantsByProduct);
            int stock = variant != null ? variant.getStock() : product.getStock();
            if (cartItem.getQuantity() > stock) {
                throw new BaseException("shop.stock.insufficient", product.getName());
            }
            // The order item price snapshot is the effective (promotion) price.
            BigDecimal unitPrice = prices.effective(product.getId(),
                    variant != null ? variant.getPrice() : product.getPrice());
            itemsByStore.computeIfAbsent(product.getStoreId(), k -> new ArrayList<>())
                    .add(new PlanItem(cartItem.getId(), product, variant, cartItem.getQuantity(), unitPrice));
        }

        List<StorePlan> storePlans = buildStorePlans(username, request, stores, itemsByStore);
        return applyPlatformVoucher(username, request, address, storePlans, cartItems);
    }

    private ProductVariant resolveVariant(Product product, CartItem cartItem,
            Map<UUID, List<ProductVariant>> variantsByProduct) {
        List<ProductVariant> variants = variantsByProduct.getOrDefault(product.getId(), List.of());
        if (variants.isEmpty()) {
            if (cartItem.getVariantId() != null) {
                throw new BaseException("shop.checkout.itemUnavailable", product.getName());
            }
            return null;
        }
        return variants.stream().filter(v -> v.getId().equals(cartItem.getVariantId())).findFirst()
                .orElseThrow(() -> new BaseException("shop.checkout.itemUnavailable", product.getName()));
    }

    private List<StorePlan> buildStorePlans(String username, CheckoutRequest request, Map<UUID, Store> stores,
            Map<UUID, List<PlanItem>> itemsByStore) {
        Map<UUID, String> storeVouchers = request.storeVouchers() == null ? Map.of() : request.storeVouchers();
        for (UUID voucherStoreId : storeVouchers.keySet()) {
            if (!itemsByStore.containsKey(voucherStoreId)) {
                throw new BaseException("shop.voucher.notApplicable");
            }
        }
        ShopProperties.Order cfg = shopProperties.getOrder();
        List<StorePlan> plans = new ArrayList<>();
        for (Map.Entry<UUID, List<PlanItem>> entry : itemsByStore.entrySet()) {
            UUID storeId = entry.getKey();
            BigDecimal subtotal = entry.getValue().stream().map(PlanItem::lineTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal shipping = subtotal.compareTo(cfg.getFreeShipThreshold()) >= 0 ? BigDecimal.ZERO
                    : cfg.getShippingFee();
            Voucher storeVoucher = null;
            BigDecimal storeDiscount = BigDecimal.ZERO;
            String code = storeVouchers.get(storeId);
            if (code != null && !code.isBlank()) {
                VoucherSupport.Applied applied = voucherSupport.validate(code, storeId, username, subtotal);
                storeVoucher = applied.voucher();
                storeDiscount = applied.discount();
            }
            plans.add(new StorePlan(stores.get(storeId), entry.getValue(), TextSupport.money(subtotal),
                    TextSupport.money(shipping), storeVoucher, storeDiscount, BigDecimal.ZERO));
        }
        return plans;
    }

    /** The platform voucher applies to the merchandise value after store discounts, split pro rata across orders. */
    private Plan applyPlatformVoucher(String username, CheckoutRequest request, Address address,
            List<StorePlan> storePlans, List<CartItem> cartItems) {
        Voucher platformVoucher = null;
        BigDecimal platformDiscount = BigDecimal.ZERO;
        List<StorePlan> finalPlans = storePlans;
        String code = request.platformVoucherCode();
        if (code != null && !code.isBlank()) {
            BigDecimal base = storePlans.stream().map(p -> p.subtotal().subtract(p.storeDiscount()))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            VoucherSupport.Applied applied = voucherSupport.validate(code, null, username, base);
            platformVoucher = applied.voucher();
            platformDiscount = applied.discount();
            finalPlans = new ArrayList<>();
            BigDecimal allocated = BigDecimal.ZERO;
            for (int i = 0; i < storePlans.size(); i++) {
                StorePlan plan = storePlans.get(i);
                BigDecimal share;
                if (i == storePlans.size() - 1) {
                    share = platformDiscount.subtract(allocated);
                } else {
                    share = base.signum() == 0 ? BigDecimal.ZERO
                            : platformDiscount.multiply(plan.subtotal().subtract(plan.storeDiscount()))
                                    .divide(base, 2, RoundingMode.HALF_UP);
                }
                allocated = allocated.add(share);
                finalPlans.add(plan.withPlatformDiscount(share));
            }
        }
        BigDecimal total = finalPlans.stream().map(StorePlan::total).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new Plan(address, finalPlans, platformVoucher, platformDiscount, total, cartItems);
    }
}
