package com.fpt.bom.sa.dto.permission;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Author: hoanglm21@fpt.com
 * Date: 27/7/26
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionImportRenameHint {

    private String currentCode;

    private String incomingCode;

    private String uri;

    private String buttonAction;

    private String name;
}
