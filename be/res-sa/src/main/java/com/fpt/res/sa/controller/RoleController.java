package com.fpt.res.sa.controller;

import java.util.UUID;

import com.fpt.bom.sa.dto.role.RoleFilterRequest;
import com.fpt.bom.sa.dto.role.RoleCreateRequest;
import com.fpt.bom.sa.dto.role.RoleUpdateRequest;
import com.fpt.bom.sa.service.RoleService;
import com.fpt.core.common.annotation.SkipPermissionCheck;
import com.fpt.core.common.dto.UUIDBulkRequest;
import com.fpt.core.common.dto.UUIDRequest;
import com.fpt.core.common.web.Response;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Author: hoanglm21@fpt.com
 * Date: 1/1/26
 */
@RestController
@RequestMapping("/sa/role")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    @GetMapping("/options")
    @SkipPermissionCheck
    public Response<?> options() {
        return Response.ok(roleService.options());
    }

    @GetMapping("/search")
    public Response<?> search(@Valid @ModelAttribute RoleFilterRequest filter) {
        return Response.ok(roleService.search(filter));
    }

    @GetMapping("/{id}")
    public Response<?> view(@PathVariable UUID id) {
        return Response.ok(roleService.view(id));
    }

    @PostMapping("/create")
    public Response<?> create(@Valid @RequestBody RoleCreateRequest request) {
        roleService.create(request);
        return Response.ok();
    }

    @PostMapping("/update")
    public Response<?> update(@Valid @RequestBody RoleUpdateRequest request) {
        roleService.update(request);
        return Response.ok();
    }

    @PostMapping("/delete")
    public Response<?> delete(@Valid @RequestBody UUIDRequest request) {
        roleService.delete(request.getId());
        return Response.ok();
    }

    @PostMapping("/active")
    public Response<?> active(@Valid @RequestBody UUIDRequest request) {
        roleService.active(request.getId());
        return Response.ok();
    }

    @PostMapping("/inactive")
    public Response<?> inactive(@Valid @RequestBody UUIDRequest request) {
        roleService.inactive(request.getId());
        return Response.ok();
    }

    @PostMapping("/active-bulk")
    public Response<?> activeBulk(@Valid @RequestBody UUIDBulkRequest request) {
        roleService.activeBulk(request.getIds());
        return Response.ok();
    }

    @PostMapping("/inactive-bulk")
    public Response<?> inactiveBulk(@Valid @RequestBody UUIDBulkRequest request) {
        roleService.inactiveBulk(request.getIds());
        return Response.ok();
    }

    @PostMapping("/delete-bulk")
    public Response<?> deleteBulk(@Valid @RequestBody UUIDBulkRequest request) {
        roleService.deleteBulk(request.getIds());
        return Response.ok();
    }
}
