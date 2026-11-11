package com.fpt.core.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

/**
 * Author: hoanglm21@fpt.com
 * Date: 19/05/2026
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class UUIDBulkRequest {

    @NotNull(message = "{common.ids.notNull}")
    private List<UUID> ids;
}
