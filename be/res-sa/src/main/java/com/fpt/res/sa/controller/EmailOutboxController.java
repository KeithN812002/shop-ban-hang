package com.fpt.res.sa.controller;

import com.fpt.core.email.dto.emailOutbox.EmailOutboxFilterRequest;
import com.fpt.core.email.service.EmailOutboxService;
import com.fpt.core.common.dto.UUIDBulkRequest;
import com.fpt.core.common.dto.UUIDRequest;
import com.fpt.core.common.web.Response;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Author: hoanglm21@fpt.com
 * Date: 02/06/2026
 */
@RestController
@RequestMapping("/sa/email-outbox")
@RequiredArgsConstructor
public class EmailOutboxController {

    private final EmailOutboxService emailOutboxService;

    @GetMapping("/search")
    public Response<?> search(@Valid @ModelAttribute EmailOutboxFilterRequest filter) {
        return Response.ok(emailOutboxService.search(filter));
    }

    @GetMapping("/{id}")
    public Response<?> view(@PathVariable UUID id) {
        return Response.ok(emailOutboxService.view(id));
    }

    @PostMapping("/resend")
    public Response<?> resend(@Valid @RequestBody UUIDRequest request) {
        emailOutboxService.resend(request.getId());
        return Response.ok();
    }

    @PostMapping("/resend-bulk")
    public Response<?> resendBulk(@Valid @RequestBody UUIDBulkRequest request) {
        emailOutboxService.resendBulk(request.getIds());
        return Response.ok();
    }
}

