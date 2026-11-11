package com.fpt.bom.shop.service.support;

import com.fpt.bom.shop.entity.Product;
import com.fpt.bom.shop.entity.Store;
import com.fpt.bom.shop.enums.ApprovalStatus;
import com.fpt.bom.shop.enums.ProductStatus;
import com.fpt.core.common.util.TextUtils;
import com.fpt.core.persistence.spec.SpecificationBuilder;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.UUID;

import static com.fpt.core.persistence.spec.JpaFieldSpecifications.between;
import static com.fpt.core.persistence.spec.JpaFieldSpecifications.eq;
import static com.fpt.core.persistence.spec.JpaFieldSpecifications.ge;
import static com.fpt.core.persistence.spec.JpaFieldSpecifications.in;

/** Reusable product predicates. */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class ProductSpecs {

    /** Products a shopper may see: ACTIVE, not deleted, sold by an ACTIVE store. */
    public static Specification<Product> publiclyVisible() {
        return new SpecificationBuilder<Product>()
                .and(eq("status", ProductStatus.ACTIVE))
                .and(eq("isDeleted", false))
                .and(storeActive())
                .build();
    }

    /** Public search predicate (visibility + user filters). */
    public static Specification<Product> publicSearch(String keyword, Collection<UUID> categoryIds, UUID storeId,
            BigDecimal minPrice, BigDecimal maxPrice, Double minRating) {
        return new SpecificationBuilder<Product>()
                .and(publiclyVisible())
                .and(keyword(keyword))
                .and(in("categoryId", categoryIds))
                .and(eq("storeId", storeId))
                .and(between("price", minPrice, maxPrice))
                .and(minRating != null ? ge("ratingAvg", minRating) : null)
                .build();
    }

    public static Specification<Product> keyword(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) {
                return cb.conjunction();
            }
            // Accent-insensitive: "kinh mat" and "kính" both match "Kính mát" (PostgreSQL unaccent extension).
            String pattern = "%" + TextUtils.escapeSqlLike(TextSupport.fold(keyword)) + "%";
            return cb.or(
                    cb.like(cb.function("unaccent", String.class, cb.lower(root.get("name"))), pattern, '\\'),
                    cb.like(cb.function("unaccent", String.class,
                            cb.lower(cb.coalesce(root.get("tags"), ""))), pattern, '\\'));
        };
    }

    private static Specification<Product> storeActive() {
        return (root, query, cb) -> {
            Subquery<UUID> sub = query.subquery(UUID.class);
            Root<Store> store = sub.from(Store.class);
            sub.select(store.get("id")).where(
                    cb.equal(store.get("status"), ApprovalStatus.ACTIVE),
                    cb.equal(store.get("isDeleted"), false));
            return root.get("storeId").in(sub);
        };
    }
}
