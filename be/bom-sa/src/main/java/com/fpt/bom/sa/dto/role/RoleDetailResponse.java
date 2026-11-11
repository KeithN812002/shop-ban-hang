package com.fpt.bom.sa.dto.role;

import java.util.UUID;

import com.fpt.core.common.dto.AuditableResponse;
import com.fpt.core.common.enums.StatusBasic;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Author: hoanglm21@fpt.com
 * Date: 1/1/26
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class RoleDetailResponse extends AuditableResponse {

    private UUID id;

    private String code;

    private String name;

    private StatusBasic status;

    private List<UUID> permissionIds;
}
