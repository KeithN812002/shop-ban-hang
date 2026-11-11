package com.fpt.res.sa.controller;

import com.fpt.core.email.dto.emailTemplate.EmailTemplateFilterRequest;
import com.fpt.core.email.dto.emailTemplate.EmailTemplateUpdateRequest;
import com.fpt.core.email.service.EmailTemplateService;
import com.fpt.core.common.dto.UUIDBulkRequest;
import com.fpt.core.common.dto.UUIDRequest;
import com.fpt.core.common.web.Response;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Author: hoanglm21@fpt.com
 * Date: 03/06/2026
 */
@RestController
@RequestMapping("/sa/email-template/{type}")
@RequiredArgsConstructor
public class EmailTemplateController {

    private final EmailTemplateService emailTemplateService;

    @GetMapping("/search")
    public Response<?> search(@PathVariable String type,
            @Valid @ModelAttribute EmailTemplateFilterRequest filter) {
        return Response.ok(emailTemplateService.search(type, filter));
    }

    @GetMapping("/{id}")
    public Response<?> view(@PathVariable String type, @PathVariable UUID id) {
        return Response.ok(emailTemplateService.view(type, id));
    }

    @PostMapping("/update")
    public Response<?> update(@PathVariable String type,
            @Valid @RequestBody EmailTemplateUpdateRequest request) {
        emailTemplateService.update(type, request);
        return Response.ok();
    }

    @PostMapping("/active")
    public Response<?> active(@PathVariable String type, @Valid @RequestBody UUIDRequest request) {
        emailTemplateService.active(type, request.getId());
        return Response.ok();
    }

    @PostMapping("/inactive")
    public Response<?> inactive(@PathVariable String type, @Valid @RequestBody UUIDRequest request) {
        emailTemplateService.inactive(type, request.getId());
        return Response.ok();
    }

    @PostMapping("/active-bulk")
    public Response<?> activeBulk(@PathVariable String type, @Valid @RequestBody UUIDBulkRequest request) {
        emailTemplateService.activeBulk(type, request.getIds());
        return Response.ok();
    }

    @PostMapping("/inactive-bulk")
    public Response<?> inactiveBulk(@PathVariable String type, @Valid @RequestBody UUIDBulkRequest request) {
        emailTemplateService.inactiveBulk(type, request.getIds());
        return Response.ok();
    }
}
