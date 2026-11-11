package com.fpt.core.persistence.spec;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.springframework.data.jpa.domain.Specification;

import java.util.function.BiFunction;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class JpaJoinSpecifications {

    public static <T, U> Specification<T> joinEq(String joinProperty, String attribute, Object value) {
        return (root, query, cb) -> {
            if (value == null) {
                return cb.conjunction();
            }
            Join<T, U> join = root.join(joinProperty);
            return cb.equal(join.get(attribute), value);
        };
    }

    public static <T> Specification<T> fetchOrJoin(String attribute, JoinType joinType) {
        return (root, query, cb) -> {
            if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                root.fetch(attribute, joinType);
            } else {
                root.join(attribute, joinType);
            }
            return cb.conjunction();
        };
    }

    public static <T, C> Specification<T> existsChild(Class<C> childType, String parentAttribute,
            BiFunction<Root<C>, CriteriaBuilder, Predicate> condition) {
        return (root, query, cb) -> {
            Subquery<Long> subquery = query.subquery(Long.class);
            Root<C> subRoot = subquery.from(childType);
            subquery.select(cb.literal(1L));
            Predicate predicate = cb.equal(subRoot.get(parentAttribute), root);
            Predicate extra = condition.apply(subRoot, cb);
            subquery.where(extra == null ? predicate : cb.and(predicate, extra));
            return cb.exists(subquery);
        };
    }
}
