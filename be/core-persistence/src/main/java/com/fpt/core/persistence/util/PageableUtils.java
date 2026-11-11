package com.fpt.core.persistence.util;

import com.fpt.core.common.dto.PageResult;
import com.fpt.core.common.dto.PagingBase;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.Objects;
import java.util.function.Function;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class PageableUtils {

    public static Pageable pageable(PagingBase request) {
        return Objects.requireNonNull(pageable(request.getPageNumber() - 1, request.getPageSize(),
                request.getSortExpr()));
    }

    public static Pageable pageable(Integer page, Integer size, String sortExpression) {
        Sort sort = Sort.unsorted();

        if (sortExpression != null && !sortExpression.isBlank()) {
            String[] fields = sortExpression.split(",");
            for (String f : fields) {
                String[] parts = f.trim().split(":");
                String field = parts[0];
                Sort.Direction dir = (parts.length > 1 && "DESC".equalsIgnoreCase(parts[1]))
                        ? Sort.Direction.DESC
                        : Sort.Direction.ASC;
                sort = sort.and(Sort.by(dir, field));
            }
        }

        if (page == null || size == null) {
            return Pageable.unpaged();
        }

        if (sort.isUnsorted()) {
            return PageRequest.of(page, size);
        }

        return PageRequest.of(page, size, sort);
    }

    public static <E, D> PageResult<D> toPageResult(Page<E> page, Function<E, D> mapper) {
        PageResult<D> result = new PageResult<>();

        result.setItems(page.getContent().stream().map(mapper).toList());
        result.setTotalElements(page.getTotalElements());
        result.setTotalPages(page.getTotalPages());
        result.setPageNumber(page.getNumber() + 1);
        result.setPageSize(page.getSize());

        return result;
    }
}


