package com.fpt.core.persistence.spec;

import com.fpt.core.common.dto.AuditFilter;
import com.fpt.core.common.dto.HistoryFilter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;

import jakarta.persistence.criteria.Path;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.springframework.data.jpa.domain.Specification;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class JpaFieldSpecifications {

    public static <T> Specification<T> eq(String field, Object value) {
        return (root, query, cb) -> {
            if (value == null) {
                return cb.conjunction();
            }
            return cb.equal(root.get(field), value);
        };
    }

    public static <T> Specification<T> ne(String field, Object value) {
        return (root, query, cb) -> {
            if (value == null) {
                return cb.conjunction();
            }
            return cb.notEqual(root.get(field), value);
        };
    }

    public static <T, V extends Comparable<V>> Specification<T> ge(String field, V value) {
        return (root, query, cb) -> {
            if (value == null) {
                return cb.conjunction();
            }
            Path<V> path = root.get(field);
            return cb.or(
                    cb.isNull(path),
                    cb.greaterThanOrEqualTo(path, value)
            );
        };
    }

    public static <T, V extends Comparable<V>> Specification<T> le(String field, V value) {
        return (root, query, cb) -> {
            if (value == null) {
                return cb.conjunction();
            }
            Path<V> path = root.get(field);
            return cb.lessThanOrEqualTo(path, value);
        };
    }

    public static <T, V extends Comparable<V>> Specification<T> between(String field, V from, V to) {
        return (root, query, cb) -> {
            Path<V> path = root.get(field);
            if (from == null && to == null) {
                return cb.conjunction();
            }
            if (from != null && to != null) {
                V start = from.compareTo(to) <= 0 ? from : to;
                V end = from.compareTo(to) <= 0 ? to : from;
                return cb.between(path, start, end);
            }
            if (from != null) {
                return cb.greaterThanOrEqualTo(path, from);
            }
            return cb.lessThanOrEqualTo(path, to);
        };
    }

    public static <T> Specification<T> auditFields(Object createdBy, LocalDateTime createdFrom,
            LocalDateTime createdTo, Object updatedBy, LocalDateTime updatedFrom, LocalDateTime updatedTo) {
        return new SpecificationBuilder<T>()
                .and(eq("createdBy", createdBy))
                .and(between("createdDate", createdFrom, createdTo))
                .and(eq("updatedBy", updatedBy))
                .and(between("updatedDate", updatedFrom, updatedTo))
                .build();
    }

    public static <T> Specification<T> auditFields(AuditFilter filter) {
        return auditFields(filter.getCreatedBy(), filter.getCreatedDateFrom(), filter.getCreatedDateTo(),
                filter.getUpdatedBy(), filter.getUpdatedDateFrom(), filter.getUpdatedDateTo());
    }

    public static <T> Specification<T> historyWindow(HistoryFilter filter) {
        return new SpecificationBuilder<T>()
                .and(between("startTime", filter.getStartTimeFrom(), filter.getStartTimeTo()))
                .and(between("endTime", filter.getEndTimeFrom(), filter.getEndTimeTo()))
                .and(in("action", filter.getAction()))
                .and(in("actionSource", filter.getActionSource()))
                .build();
    }

    public static <T> Specification<T> betweenDays(String field, LocalDate fromDate, LocalDate toDate) {
        LocalDateTime from = fromDate != null ? fromDate.atStartOfDay() : null;
        LocalDateTime to = toDate != null ? toDate.atTime(23, 59, 59) : null;
        return between(field, from, to);
    }

    public static <T> Specification<T> onDay(String field, LocalDate date) {
        return (root, query, cb) -> date == null
                ? cb.conjunction()
                : cb.and(
                        cb.greaterThanOrEqualTo(root.get(field), date.atStartOfDay()),
                        cb.lessThan(root.get(field), date.plusDays(1).atStartOfDay()));
    }

    public static <T> Specification<T> in(String field, Collection<?> values) {
        return (root, query, cb) -> {
            if (values == null || values.isEmpty()) {
                return cb.conjunction();
            }
            return root.get(field).in(values);
        };
    }

    public static <T> Specification<T> notIn(String field, Collection<?> values) {
        return (root, query, cb) -> {
            if (values == null || values.isEmpty()) {
                return cb.conjunction();
            }
            return cb.not(root.get(field).in(values));
        };
    }

    public static <T> Specification<T> isNull(String field) {
        return (root, query, cb) -> cb.isNull(root.get(field));
    }

    public static <T> Specification<T> isNotNull(String field) {
        return (root, query, cb) -> cb.isNotNull(root.get(field));
    }
}
