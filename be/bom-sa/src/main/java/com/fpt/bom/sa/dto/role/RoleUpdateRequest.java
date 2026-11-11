package com.fpt.bom.sa.dto.role;

import java.util.UUID;

import com.fpt.core.common.enums.StatusBasic;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Author: hoanglm21@fpt.com
 * Date: 1/1/26
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class RoleUpdateRequest {

    @NotNull(message = "{common.id.notNull}")
    private UUID id;

    @NotBlank(message = "{role.name.notBlank}")
    @Size(max = 200, message = "{role.name.size}")
    private String name;

    @NotNull(message = "{status.notNull}")
    private StatusBasic status;

    @NotEmpty(message = "{role.permissionIds.notEmpty}")
    private List<UUID> permissionIds;
}
