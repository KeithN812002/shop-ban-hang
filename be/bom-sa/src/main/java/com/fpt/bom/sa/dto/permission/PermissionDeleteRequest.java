package com.fpt.bom.sa.dto.permission;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Author: hoanglm21@fpt.com
 * Date: 1/1/26
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PermissionDeleteRequest {

    @NotNull(message = "{common.id.notNull}")
    private UUID id;
}
