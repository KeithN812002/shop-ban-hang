package com.fpt.bom.sa.dto.authentication;

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
public class MeResponse {

    private String sub;

    private String email;

    private Boolean emailVerified;

    private String name;

    private String preferredUsername;

    private String unitId;

    private String positionId;

    private String departmentId;

    private String genderId;

    private String externalUnitCode;

    private Boolean isInternal;

    private List<String> modules;

    private List<PermissionFeView> permissions;
}
