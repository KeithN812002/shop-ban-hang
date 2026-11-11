package com.fpt.core.common.dto;

import com.fpt.core.common.constant.Constants;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.springframework.util.StringUtils;

import java.util.Collections;
import java.util.Objects;
import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString
public abstract class PagingBase {
    private Integer pageNumber;
    private Integer pageSize;
    private String sortType;
    private String fieldName;

    public Integer getPageNumber() {
        return pageNumber == null || pageNumber < 1 ? Constants.PAGINATION.DEFAULT_PAGE : pageNumber;
    }

    public Integer getPageSize() {
        return pageSize == null || pageSize < 1 ? Constants.PAGINATION.DEFAULT_PAGE_SIZE : pageSize;
    }

    public String getSortExpr() {
        return getFieldName() + ":" + getSortType();
    }

    public String getSortType() {
        if (!StringUtils.hasText(sortType)) {
            return getDefaultSortType();
        }

        String normalizedSortType = sortType.trim().toUpperCase();
        return Constants.PAGINATION.SORT_TYPE_ASC.equals(normalizedSortType)
                ? Constants.PAGINATION.SORT_TYPE_ASC
                : Constants.PAGINATION.SORT_TYPE_DESC;
    }

    public String getFieldName() {
        String normalizedFieldName = StringUtils.hasText(fieldName)
                ? fieldName.trim()
                : getDefaultFieldName();

        Set<String> allowedSortFields = getAllowedSortFields();
        if (allowedSortFields == null || allowedSortFields.isEmpty()) {
            return normalizedFieldName;
        }

        return allowedSortFields.stream()
                .filter(StringUtils::hasText)
                .map(s -> Objects.requireNonNull(s).trim())
                .filter(allowedField -> allowedField.equalsIgnoreCase(normalizedFieldName))
                .findFirst()
                .orElse(getDefaultFieldName());
    }

    protected String getDefaultSortType() {
        return Constants.PAGINATION.SORT_TYPE_DESC;
    }

    protected String getDefaultFieldName() {
        return Constants.PAGINATION.DEFAULT_SORT_FIELD;
    }

    protected Set<String> getAllowedSortFields() {
        return Collections.emptySet();
    }
}
