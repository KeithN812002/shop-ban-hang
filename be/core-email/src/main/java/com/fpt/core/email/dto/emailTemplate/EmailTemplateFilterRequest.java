package com.fpt.core.email.dto.emailTemplate;

import com.fpt.core.common.dto.AuditFilter;

import com.fpt.core.common.dto.PagingBase;
import com.fpt.core.common.enums.StatusBasic;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/**
 * Author: hoanglm21@fpt.com
 * Date: 03/06/2026
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class EmailTemplateFilterRequest extends PagingBase implements AuditFilter {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "eventType",
            "subjectTemplate",
            "status",
            "createdDate",
            "createdBy",
            "updatedDate",
            "updatedBy");

    private List<String> eventType;

    private String subjectTemplate;

    private List<StatusBasic> status;

    private String createdBy;

    private LocalDateTime createdDateFrom;

    private LocalDateTime createdDateTo;

    private String updatedBy;

    private LocalDateTime updatedDateFrom;

    private LocalDateTime updatedDateTo;

    @Override
    protected String getDefaultFieldName() {
        return "subjectTemplate";
    }

    @Override
    protected String getDefaultSortType() {
        return "ASC";
    }

    @Override
    protected Set<String> getAllowedSortFields() {
        return ALLOWED_SORT_FIELDS;
    }
}
