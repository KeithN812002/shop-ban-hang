package com.fpt.bom.sa.dto.permission;

import com.fpt.core.common.enums.StatusBasic;
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
public class PermissionPageCreateTransfer {

    private String name;

    private String foreignName;

    private String parentCode;

    private PermissionEnum type;

    private String urlSegment;

    private String pathFolder;

    private String uri;

    private MethodEnum method;

    private Integer sortOrder;

    private String description;

    private StatusBasic status;

    private List<PermissionFunctionCreateTransfer> functions;

    private List<PermissionApiCreateTransfer> apis;
}
