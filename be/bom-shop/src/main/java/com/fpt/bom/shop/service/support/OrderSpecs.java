package com.fpt.bom.shop.service.support;

import com.fpt.bom.shop.dto.OrderDto.OrderFilter;
import com.fpt.bom.shop.entity.OrderItem;
import com.fpt.bom.shop.entity.ReturnRequest;
import com.fpt.bom.shop.entity.ShopOrder;
import com.fpt.bom.shop.enums.JobType;
import com.fpt.bom.shop.enums.OrderStatus;
import com.fpt.bom.shop.enums.ReturnRequestStatus;
import com.fpt.core.common.util.TextUtils;
import com.fpt.core.persistence.spec.SpecificationBuilder;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.springframework.data.jpa.domain.Specification;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import static com.fpt.core.persistence.spec.JpaFieldSpecifications.betweenDays;
import static com.fpt.core.persistence.spec.JpaFieldSpecifications.eq;
import static com.fpt.core.persistence.spec.JpaFieldSpecifications.in;

/** Order listing predicates shared by the buyer, seller, shipper and admin searches. */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class OrderSpecs {

    /** Status, store, keyword and created-date range from the filter; the caller adds its own ownership scope. */
    public static SpecificationBuilder<ShopOrder> fromFilter(OrderFilter filter) {
        SpecificationBuilder<ShopOrder> builder = new SpecificationBuilder<>();
        builder.and(in("status", filter.getStatus()));
        builder.and(eq("storeId", filter.getStoreId()));
        builder.and(keyword(filter.getKeyword()));
        builder.and(betweenDays("createdDate", filter.getFromDate(), filter.getToDate()));
        builder.and(returnStatus(filter.getReturnStatus()));
        return builder;
    }

    /** Matches the order code, the receiver name or the name of any item. */
    public static Specification<ShopOrder> keyword(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) {
                return cb.conjunction();
            }
            String pattern = "%" + TextUtils.escapeSqlLike(keyword.trim().toLowerCase()) + "%";
            Subquery<UUID> items = query.subquery(UUID.class);
            Root<OrderItem> item = items.from(OrderItem.class);
            items.select(item.get("id")).where(cb.equal(item.get("orderId"), root.get("id")),
                    cb.like(cb.lower(item.get("productName")), pattern, '\\'));
            return cb.or(cb.like(cb.lower(root.get("code")), pattern, '\\'),
                    cb.like(cb.lower(root.get("receiverName")), pattern, '\\'),
                    cb.exists(items));
        };
    }

    public static Specification<ShopOrder> provinceEquals(String province) {
        return (root, query, cb) -> province == null || province.isBlank() ? cb.conjunction()
                : cb.equal(cb.lower(root.get("province")), province.trim().toLowerCase());
    }

    /** Orders whose return request is in {@code status}; no restriction when {@code status} is null. */
    public static Specification<ShopOrder> returnStatus(ReturnRequestStatus status) {
        return (root, query, cb) -> {
            if (status == null) {
                return cb.conjunction();
            }
            Subquery<UUID> requests = query.subquery(UUID.class);
            Root<ReturnRequest> request = requests.from(ReturnRequest.class);
            requests.select(request.get("id")).where(cb.equal(request.get("orderId"), root.get("id")),
                    cb.equal(request.get("status"), status));
            return cb.exists(requests);
        };
    }

    /** Shipper available list: delivery jobs (READY_TO_SHIP), return jobs (RETURN_APPROVED) or both, still untaken. */
    public static Specification<ShopOrder> availableJobs(JobType type) {
        Specification<ShopOrder> delivery = (root, query, cb) -> cb.and(
                cb.equal(root.get("status"), OrderStatus.READY_TO_SHIP), cb.isNull(root.get("shipperUsername")));
        Specification<ShopOrder> returns = (root, query, cb) -> cb.and(
                cb.equal(root.get("status"), OrderStatus.RETURN_APPROVED),
                cb.isNull(root.get("returnShipperUsername")));
        if (type == JobType.RETURN) {
            return returns;
        }
        return type == JobType.ALL ? delivery.or(returns) : delivery;
    }

    /**
     * The shipper's own orders in {@code statuses}: delivery-side statuses match the delivery shipper, the return
     * pickup status RETURN_SHIPPING matches the return shipper.
     */
    public static Specification<ShopOrder> assignedTo(String username, Collection<OrderStatus> statuses) {
        List<OrderStatus> delivery = statuses.stream().filter(s -> s != OrderStatus.RETURN_SHIPPING).toList();
        boolean returnLeg = statuses.contains(OrderStatus.RETURN_SHIPPING);
        return (root, query, cb) -> {
            var returning = cb.and(cb.equal(root.get("returnShipperUsername"), username),
                    cb.equal(root.get("status"), OrderStatus.RETURN_SHIPPING));
            if (delivery.isEmpty()) {
                return returnLeg ? returning : cb.disjunction();
            }
            var mine = cb.and(cb.equal(root.get("shipperUsername"), username), root.get("status").in(delivery));
            return returnLeg ? cb.or(mine, returning) : mine;
        };
    }
}
