package com.fpt.res.sa.controller;

import com.fpt.bom.sa.dto.user.external.ExternalUserCreateRequest;
import com.fpt.bom.sa.dto.user.external.ExternalUserFilterRequest;
import com.fpt.bom.sa.dto.user.external.ExternalUserUpdateRequest;
import com.fpt.bom.sa.service.ExternalUserService;
import com.fpt.core.common.annotation.SkipPermissionCheck;
import com.fpt.core.common.dto.UUIDBulkRequest;
import com.fpt.core.common.dto.UUIDRequest;
import com.fpt.core.common.web.Response;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Author: hoanglm21@fpt.com
 * Date: 1/1/26
 */
@RestController
@RequestMapping("/sa/external-user")
@RequiredArgsConstructor
@Validated
public class ExternalUserController {

    private final ExternalUserService externalUserService;

    @GetMapping("/options")
    @SkipPermissionCheck
    public Response<?> options(@RequestParam @NotBlank(message = "{user.externalUnitCode.notBlank}") String externalUnitCode) {
        return Response.ok(externalUserService.options(externalUnitCode));
    }

    @GetMapping("/search")
    public Response<?> search(@Valid @ModelAttribute ExternalUserFilterRequest filter) {
        return Response.ok(externalUserService.search(filter));
    }

    @GetMapping("/{id}")
    public Response<?> view(@PathVariable UUID id) {
        return Response.ok(externalUserService.view(id));
    }

    @PostMapping("/create")
    public Response<?> create(@Valid @RequestBody ExternalUserCreateRequest request) {
        externalUserService.create(request);
        return Response.ok();
    }

    @PostMapping("/update")
    public Response<?> update(@Valid @RequestBody ExternalUserUpdateRequest request) {
        externalUserService.update(request);
        return Response.ok();
    }

    @PostMapping("/active")
    public Response<?> active(@Valid @RequestBody UUIDRequest request) {
        externalUserService.active(request.getId());
        return Response.ok();
    }

    @PostMapping("/inactive")
    public Response<?> inactive(@Valid @RequestBody UUIDRequest request) {
        externalUserService.inactive(request.getId());
        return Response.ok();
    }

    @PostMapping("/delete")
    public Response<?> delete(@Valid @RequestBody UUIDRequest request) {
        externalUserService.delete(request.getId());
        return Response.ok();
    }

    @PostMapping("/active-bulk")
    public Response<?> activeBulk(@Valid @RequestBody UUIDBulkRequest request) {
        externalUserService.activeBulk(request.getIds());
        return Response.ok();
    }

    @PostMapping("/inactive-bulk")
    public Response<?> inactiveBulk(@Valid @RequestBody UUIDBulkRequest request) {
        externalUserService.inactiveBulk(request.getIds());
        return Response.ok();
    }

    @PostMapping("/delete-bulk")
    public Response<?> deleteBulk(@Valid @RequestBody UUIDBulkRequest request) {
        externalUserService.deleteBulk(request.getIds());
        return Response.ok();
    }

    @PostMapping("/reset-password")
    public Response<?> resetPassword(@Valid @RequestBody UUIDRequest request) {
        externalUserService.resetPassword(request.getId());
        return Response.ok();
    }

    @PostMapping("/reset-password-bulk")
    public Response<?> resetPasswordBulk(@Valid @RequestBody UUIDBulkRequest request) {
        externalUserService.resetPasswordBulk(request.getIds());
        return Response.ok();
    }
}
