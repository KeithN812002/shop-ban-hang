package com.fpt.bom.sa.dto.user.external;

import com.fpt.core.common.constant.Constants;
import com.fpt.core.common.enums.StatusBasic;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * Author: hoanglm21@fpt.com
 * Date: 1/1/26
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ExternalUserCreateRequest {

    @NotBlank(message = "{user.userName.notBlank}")
    @Size(max = 50, message = "{user.userName.size}")
    @Pattern(regexp = Constants.REGEX.USER_NAME, message = "{user.userName.pattern}")
    private String userName;

    @NotBlank(message = "{user.personalName.notBlank}")
    @Size(max = 200, message = "{user.personalName.size}")
    private String personalName;

    @NotBlank(message = "{user.email.notBlank}")
    @Email(regexp = Constants.REGEX.EMAIL, message = "{user.email.valid}")
    @Size(max = 100, message = "{user.email.size}")
    private String email;

    @NotNull(message = "{status.notNull}")
    private StatusBasic status;

    private UUID genderId;


    @NotBlank(message = "{user.externalUnitCode.notBlank}")
    @Size(max = 50, message = "{user.externalUnitCode.size}")
    private String externalUnitCode;

    @NotEmpty(message = "{user.roles.notEmpty}")
    private List<String> roles;
}
