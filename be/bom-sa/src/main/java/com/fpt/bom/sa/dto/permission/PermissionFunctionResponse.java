package com.fpt.bom.sa.dto.permission;

import java.util.UUID;
import com.fpt.core.common.enums.MethodEnum;

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
public class PermissionFunctionResponse {

    private UUID id;

    private String code;

    private String name;

    private String buttonAction;

    private String uri;

    private MethodEnum method;

    private Integer sortOrder;

    private String status;
}
