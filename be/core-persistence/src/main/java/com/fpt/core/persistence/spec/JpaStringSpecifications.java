package com.fpt.core.persistence.spec;

import com.fpt.core.common.util.TextUtils;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.springframework.data.jpa.domain.Specification;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class JpaStringSpecifications {

    public static <T> Specification<T> like(String field, String value) {
        return (root, query, cb) -> {
            String pattern = containsPattern(value);
            return pattern == null ? cb.conjunction() : cb.like(cb.lower(root.get(field)), pattern, '\\');
        };
    }

    private static String containsPattern(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return "%" + TextUtils.escapeSqlLike(value.trim().toLowerCase()) + "%";
    }
}
