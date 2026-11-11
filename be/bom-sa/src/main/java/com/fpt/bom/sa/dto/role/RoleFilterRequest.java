package com.fpt.bom.sa.dto.role;

import com.fpt.core.common.dto.AuditFilter;

import com.fpt.core.common.dto.PagingBase;
import com.fpt.core.common.enums.StatusBasic;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/**
 * Author: hoanglm21@fpt.com
 * Date: 1/1/26
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class RoleFilterRequest extends PagingBase implements AuditFilter {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "code",
            "name",
            "createdDate",
            "createdBy",
            "updatedDate",
            "updatedBy");

    private String code;

    private String name;

    private List<StatusBasic> status;

    private String createdBy;

    private LocalDateTime createdDateFrom;

    private LocalDateTime createdDateTo;

    private String updatedBy;

    private LocalDateTime updatedDateFrom;

    private LocalDateTime updatedDateTo;

    @Override
    protected Set<String> getAllowedSortFields() {
        return ALLOWED_SORT_FIELDS;
    }
}
