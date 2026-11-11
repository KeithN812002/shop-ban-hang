package com.fpt.core.persistence.spec;

import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.springframework.data.jpa.domain.Specification;

import java.util.Collection;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class SelectedFirstSpecs {

    public static <T> Specification<T> orderSelectedFirst(Specification<T> baseSpec, String keyField,
            Collection<String> selectedKeys, String sortField, String sortDir, String defaultSortField) {
        return (root, query, cb) -> {
            Predicate predicate = baseSpec.toPredicate(root, query, cb);
            if (Long.class != query.getResultType()) {
                Expression<Object> caseExpr = cb.selectCase()
                        .when(root.get(keyField).in(selectedKeys), 0)
                        .otherwise(1);

                String field = sortField == null || sortField.isBlank() ? defaultSortField : sortField;
                String dir = sortDir == null || sortDir.isBlank() ? "ASC" : sortDir;

                Expression<?> sortExpr = root.get(field);
                query.orderBy(
                        cb.asc(caseExpr),
                        "DESC".equalsIgnoreCase(dir) ? cb.desc(sortExpr) : cb.asc(sortExpr));
            }
            return predicate;
        };
    }
}
