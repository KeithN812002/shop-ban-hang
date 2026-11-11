package com.fpt.bom.sa.dto.user.internal;

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
import java.util.UUID;

/**
 * Author: hoanglm21@fpt.com
 * Date: 1/1/26
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class InternalUserFilterRequest extends PagingBase implements AuditFilter {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "userName",
            "personalName",
            "email",
            "createdDate",
            "createdBy",
            "updatedDate",
            "updatedBy");

    private String userName;

    private String personalName;

    private String email;

    private List<StatusBasic> status;

    private List<UUID> unitId;

    private List<UUID> departmentId;

    private List<UUID> positionId;

    private List<UUID> genderId;

    private String createdBy;

    private LocalDateTime createdDateFrom;

    private LocalDateTime createdDateTo;

    private String updatedBy;

    private LocalDateTime updatedDateFrom;

    private LocalDateTime updatedDateTo;

    private Boolean unassignedRole;

    @Override
    protected Set<String> getAllowedSortFields() {
        return ALLOWED_SORT_FIELDS;
    }
}
