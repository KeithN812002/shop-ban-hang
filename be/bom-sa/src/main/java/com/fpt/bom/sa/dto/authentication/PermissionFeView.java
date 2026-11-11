package com.fpt.bom.sa.dto.authentication;
import com.fpt.core.common.enums.PermissionEnum;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Author: hoanglm21@fpt.com
 * Date: 1/1/26
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionFeView {

    private String moduleCode;

    private String code;

    private String name;

    private String foreignName;

    private PermissionEnum type;

    private String parentCode;

    private String url;

    private String pathFolder;

    private String icon;

    private String buttonAction;

    private Integer sortOrder;
}
