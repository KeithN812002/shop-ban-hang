package com.fpt.res.sa.controller;

import com.fpt.bom.sa.dto.authentication.ConfirmChangePasswordRequest;
import com.fpt.bom.sa.dto.authentication.RequestOtpRequest;
import com.fpt.bom.sa.dto.authentication.ExchangeAuthCodeRequest;
import com.fpt.bom.sa.dto.authentication.RefreshTokenRequest;
import com.fpt.bom.sa.service.AuthenticationService;
import com.fpt.core.common.annotation.SkipPermissionCheck;
import com.fpt.core.common.web.Response;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Author: hoanglm21@fpt.com
 * Date: 1/1/26
 */
@RestController
@RequestMapping("/sa/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    @PostMapping(value = "/exchange-auth-code", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public Response<?> exchangeAuthCode(@Valid @ModelAttribute ExchangeAuthCodeRequest request) {
        return Response.ok(authenticationService.exchangeAuthCode(request));
    }

    @PostMapping("/refresh-token")
    public Response<?> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        return Response.ok(authenticationService.refreshToken(request));
    }

    @GetMapping("/me")
    @SkipPermissionCheck
    public Response<?> me() {
        return Response.ok(authenticationService.me());
    }

    @PostMapping("/request-otp")
    @SkipPermissionCheck
    public Response<?> requestOtp(@Valid @RequestBody RequestOtpRequest request) {
        return Response.ok(authenticationService.requestOtp(request));
    }

    @PostMapping("/resend-otp")
    @SkipPermissionCheck
    public Response<?> resendOtp() {
        return Response.ok(authenticationService.resendOtp());
    }

    @PostMapping("/confirm-change-password")
    @SkipPermissionCheck
    public Response<?> confirmChangePassword(@Valid @RequestBody ConfirmChangePasswordRequest request) {
        authenticationService.confirmChangePassword(request);
        return Response.ok();
    }

    @GetMapping("/password-policy")
    @SkipPermissionCheck
    public Response<?> getPasswordPolicy() {
        return Response.ok(authenticationService.getPasswordPolicy());
    }

    @PostMapping("/logout")
    @SkipPermissionCheck
    public Response<?> logout() {
        authenticationService.logout();
        return Response.ok();
    }
}