package com.fpt.bom.sa.dto.permission;

import com.fpt.core.common.enums.MethodEnum;
import com.fpt.core.common.enums.PermissionEnum;
import com.fpt.core.common.enums.StatusBasic;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Author: hoanglm21@fpt.com
 * Date: 27/7/26
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionExportItem {

    private UUID id;

    private String code;

    private String name;

    private String foreignName;

    private String parentCode;

    private String appCode;

    private String moduleCode;

    private PermissionEnum type;

    private String url;

    private String urlSegment;

    private String pathFolder;

    private String uri;

    private MethodEnum method;

    private String buttonAction;

    private String icon;

    private Integer sortOrder;

    private String description;

    private StatusBasic status;
}
