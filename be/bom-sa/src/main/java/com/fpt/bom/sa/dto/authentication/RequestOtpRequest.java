package com.fpt.bom.sa.dto.authentication;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Author: hoanglm21@fpt.com
 * Date: 1/1/26
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class RequestOtpRequest {

    @NotBlank(message = "{auth.changePassword.old.notBlank}")
    @Size(min = 6, max = 100, message = "{auth.changePassword.old.size}")
    private String oldPassword;

    @NotBlank(message = "{auth.changePassword.new.notBlank}")
    @Size(min = 6, max = 100, message = "{auth.changePassword.new.size}")
    private String newPassword;
}
