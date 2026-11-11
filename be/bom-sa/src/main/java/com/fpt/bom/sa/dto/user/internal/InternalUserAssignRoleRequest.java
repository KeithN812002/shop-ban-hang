package com.fpt.bom.sa.dto.user.internal;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * Author: hoanglm21@fpt.com
 * Date: 3/30/26
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class InternalUserAssignRoleRequest {

    @NotNull
    private UUID id;

    @NotEmpty(message = "{user.roles.notEmpty}")
    private List<String> roles;
}
