package com.fpt.bom.sa.dto.permission;

import java.util.UUID;
import com.fpt.core.common.enums.MethodEnum;
import com.fpt.core.common.enums.PermissionEnum;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Author: hoanglm21@fpt.com
 * Date: 1/1/26
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionDetailResponse {

    private UUID id;

    private String code;

    private String name;

    private String foreignName;

    private String parentCode;

    private PermissionEnum type;

    private String url;

    private String urlSegment;

    private String pathFolder;

    private String uri;

    private MethodEnum method;

    private String icon;

    private Integer sortOrder;

    private String status;

    private String description;

    private List<PermissionFunctionResponse> functions;

    private List<PermissionApiResponse> apis;
}
