package com.fpt.bom.sa.dto.permission;

import java.util.UUID;

import com.fpt.core.common.enums.StatusBasic;
import com.fpt.core.common.enums.MethodEnum;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
public class PermissionUpdateRequest {

    @NotNull(message = "{common.id.notNull}")
    private UUID id;

    @NotBlank(message = "{permission.name.notBlank}")
    @Size(max = 200, message = "{permission.name.size}")
    private String name;

    @NotBlank(message = "{permission.foreignName.notBlank}")
    @Size(max = 200, message = "{permission.foreignName.size}")
    private String foreignName;

    private String parentCode;

    @Size(max = 200, message = "{permission.urlSegment.size}")
    private String urlSegment;

    @Size(max = 500, message = "{permission.pathFolder.size}")
    private String pathFolder;

    @Size(max = 500, message = "{permission.uri.size}")
    private String uri;

    private MethodEnum method;

    @Size(max = 100, message = "{permission.icon.size}")
    private String icon;

    private Integer sortOrder;

    @Size(max = 500, message = "{permission.description.size}")
    private String description;

    @NotNull(message = "{status.notNull}")
    private StatusBasic status;

    @Valid
    private List<PermissionFunctionUpdateRequest> functions;

    @Valid
    private List<PermissionApiUpdateRequest> apis;
}
