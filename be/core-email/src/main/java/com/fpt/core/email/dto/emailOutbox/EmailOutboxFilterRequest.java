package com.fpt.core.email.dto.emailOutbox;

import com.fpt.core.common.dto.AuditFilter;

import com.fpt.core.common.dto.PagingBase;
import com.fpt.core.common.enums.StatusEmailOutbox;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/**
 * Author: hoanglm21@fpt.com
 * Date: 02/06/2026
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class EmailOutboxFilterRequest extends PagingBase implements AuditFilter {
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "subject",
            "receiver",
            "sentAt",
            "retryCount",
            "createdDate",
            "createdBy",
            "updatedDate",
            "updatedBy");

    private List<String> eventType;

    private String subject;

    private String receiver;

    private List<StatusEmailOutbox> status;

    private LocalDateTime sentAtFrom;

    private LocalDateTime sentAtTo;

    private Integer retryCountFrom;

    private Integer retryCountTo;

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
