package com.fpt.bom.sa.dto.permission;

import com.fpt.core.common.enums.PermissionEnum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Author: hoanglm21@fpt.com
 * Date: 27/7/26
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionImportUpdateSummary {

    private String code;

    private PermissionEnum type;

    private String moduleCode;

    private String name;

    private List<PermissionImportFieldChange> changes;
}
