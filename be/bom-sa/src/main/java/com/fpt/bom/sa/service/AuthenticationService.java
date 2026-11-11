package com.fpt.bom.sa.service;

import com.fpt.bom.sa.dto.authentication.*;

import java.util.Map;

/**
 * Author: hoanglm21@fpt.com
 * Date: 1/1/26
 */
public interface AuthenticationService {

    ExchangeAuthCodeResponse exchangeAuthCode(ExchangeAuthCodeRequest request);

    ExchangeAuthCodeResponse refreshToken(RefreshTokenRequest request);

    MeResponse me();

    RequestOtpResponse requestOtp(RequestOtpRequest request);

    RequestOtpResponse resendOtp();

    void confirmChangePassword(ConfirmChangePasswordRequest request);

    Map<String, Object> getPasswordPolicy();

    void logout();
}