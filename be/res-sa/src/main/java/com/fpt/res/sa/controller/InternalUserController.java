package com.fpt.res.sa.controller;

import com.fpt.bom.sa.dto.user.internal.InternalUserAssignRoleRequest;
import com.fpt.bom.sa.dto.user.internal.InternalUserFilterRequest;
import com.fpt.bom.sa.service.InternalUserService;
import com.fpt.core.common.annotation.SkipPermissionCheck;
import com.fpt.core.common.dto.UUIDBulkRequest;
import com.fpt.core.common.dto.UUIDRequest;
import com.fpt.core.common.web.Response;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Author: hoanglm21@fpt.com
 * Date: 1/1/26
 */
@RestController
@RequestMapping("/sa/internal-user")
@RequiredArgsConstructor
public class InternalUserController {

    private final InternalUserService internalUserService;

    @GetMapping("/options")
    @SkipPermissionCheck
    public Response<?> options(@RequestParam UUID unitId) {
        return Response.ok(internalUserService.options(unitId));
    }

    @GetMapping("/search")
    public Response<?> search(@Valid @ModelAttribute InternalUserFilterRequest filter) {
        return Response.ok(internalUserService.search(filter));
    }

    @GetMapping("/{id}")
    public Response<?> view(@PathVariable UUID id) {
        return Response.ok(internalUserService.view(id));
    }

    @PostMapping("/assign-roles")
    public Response<?> assignRoles(@Valid @RequestBody InternalUserAssignRoleRequest request) {
        internalUserService.assignRoles(request);
        return Response.ok();
    }

    @PostMapping("/active")
    public Response<?> active(@Valid @RequestBody UUIDRequest request) {
        internalUserService.active(request.getId());
        return Response.ok();
    }

    @PostMapping("/inactive")
    public Response<?> inactive(@Valid @RequestBody UUIDRequest request) {
        internalUserService.inactive(request.getId());
        return Response.ok();
    }

    @PostMapping("/delete")
    public Response<?> delete(@Valid @RequestBody UUIDRequest request) {
        internalUserService.delete(request.getId());
        return Response.ok();
    }

    @PostMapping("/active-bulk")
    public Response<?> activeBulk(@Valid @RequestBody UUIDBulkRequest request) {
        internalUserService.activeBulk(request.getIds());
        return Response.ok();
    }

    @PostMapping("/inactive-bulk")
    public Response<?> inactiveBulk(@Valid @RequestBody UUIDBulkRequest request) {
        internalUserService.inactiveBulk(request.getIds());
        return Response.ok();
    }

    @PostMapping("/delete-bulk")
    public Response<?> deleteBulk(@Valid @RequestBody UUIDBulkRequest request) {
        internalUserService.deleteBulk(request.getIds());
        return Response.ok();
    }
}
