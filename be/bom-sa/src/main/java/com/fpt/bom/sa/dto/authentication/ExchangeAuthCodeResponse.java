package com.fpt.bom.sa.dto.authentication;

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
public class ExchangeAuthCodeResponse {

    private String idToken;

    private String accessToken;

    private String refreshToken;

    private Integer expiresIn;

    private Integer refreshExpiresIn;

    private String tokenType;

    private String scope;
}

