package com.fpt.bom.sa.dto.authentication;

import jakarta.validation.constraints.NotBlank;
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
public class ExchangeAuthCodeRequest {

    @NotBlank(message = "{auth.exchangeAuthCode.authCode.notBlank}")
    private String authCode;

    @NotBlank(message = "{auth.exchangeAuthCode.redirectUri.notBlank}")
    private String redirectUri;
}
