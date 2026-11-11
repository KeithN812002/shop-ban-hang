package com.fpt.res.sa.controller;

import java.util.UUID;

import com.fpt.bom.sa.dto.permission.PermissionCreateRequest;
import com.fpt.bom.sa.dto.permission.PermissionDeleteRequest;
import com.fpt.bom.sa.dto.permission.PermissionUpdateRequest;
import com.fpt.bom.sa.service.PermissionService;
import com.fpt.core.common.web.Response;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * Author: hoanglm21@fpt.com
 * Date: 1/1/26
 */
@RestController
@RequestMapping("/sa/permission")
@RequiredArgsConstructor
public class PermissionController {

    private final PermissionService permissionService;

    @GetMapping("/all-active-for-role")
    public Response<?> allActiveForRole() {
        return Response.ok(permissionService.allActiveForRole());
    }

    @GetMapping("/all")
    public Response<?> all() {
        return Response.ok(permissionService.all());
    }

    @GetMapping("/{id}")
    public Response<?> view(@PathVariable UUID id) {
        return Response.ok(permissionService.view(id));
    }

    @PostMapping("/create")
    public Response<?> create(@Valid @RequestBody PermissionCreateRequest request) {
        permissionService.create(request);
        return Response.ok();
    }

    @PostMapping("/update")
    public Response<?> update(@Valid @RequestBody PermissionUpdateRequest request) {
        permissionService.update(request);
        return Response.ok();
    }

    @PostMapping("/delete")
    public Response<?> delete(@Valid @RequestBody PermissionDeleteRequest request) {
        permissionService.delete(request.getId());
        return Response.ok();
    }

    @GetMapping(value = "/export", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<byte[]> export() {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename("sa_permission.json").build().toString())
                .body(permissionService.exportAsJson());
    }

    @PostMapping(value = "/import/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Response<?> importPreview(@RequestPart("file") MultipartFile file) {
        return Response.ok(permissionService.previewImport(file));
    }

    @PostMapping(value = "/import/apply", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Response<?> importApply(@RequestPart("file") MultipartFile file,
            @RequestParam int confirmDeleteCount,
            @RequestParam(defaultValue = "true") boolean applyAdd,
            @RequestParam(defaultValue = "true") boolean applyUpdate,
            @RequestParam(defaultValue = "true") boolean applyDelete) {
        return Response.ok(permissionService.applyImport(file, confirmDeleteCount, applyAdd, applyUpdate, applyDelete));
    }

}
