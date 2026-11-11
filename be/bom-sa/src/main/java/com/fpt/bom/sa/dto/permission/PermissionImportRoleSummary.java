package com.fpt.bom.sa.dto.permission;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Author: hoanglm21@fpt.com
 * Date: 28/7/26
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionImportRoleSummary {

    private String code;

    private String name;
}
