package com.fpt.bom.sa.dto.permission;

import java.util.UUID;

import com.fpt.core.common.enums.StatusBasic;
import com.fpt.core.common.enums.MethodEnum;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
public class PermissionFunctionUpdateRequest implements PermissionEndpointItem {

    private UUID id;

    @NotBlank(message = "{permission.name.notBlank}")
    @Size(max = 200, message = "{permission.name.size}")
    private String name;

    @Size(max = 50, message = "{permission.action.size}")
    private String buttonAction;

    private MethodEnum method;

    @Size(max = 500, message = "{permission.uri.size}")
    private String uri;

    private Integer sortOrder;

    @NotNull(message = "{status.notNull}")
    private StatusBasic status;
}
