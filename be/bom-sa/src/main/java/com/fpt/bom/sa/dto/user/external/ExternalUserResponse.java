package com.fpt.bom.sa.dto.user.external;

import com.fpt.core.common.dto.AuditableResponse;
import com.fpt.core.common.enums.StatusBasic;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Author: hoanglm21@fpt.com
 * Date: 1/1/26
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ExternalUserResponse extends AuditableResponse {

    private UUID id;

    private String userName;

    private String personalName;

    private String email;


    private String externalUnitCode;


    private UUID genderId;

    private String genderName;

    private StatusBasic status;
}
