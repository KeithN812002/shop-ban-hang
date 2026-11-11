package com.fpt.res.shop.controller;

import com.fpt.bom.shop.dto.ChatDto.NotificationReadRequest;
import com.fpt.bom.shop.dto.ChatDto.SendMessageRequest;
import com.fpt.bom.shop.dto.ChatDto.StartConversationRequest;
import com.fpt.bom.shop.dto.CommonDto.PagingFilter;
import com.fpt.bom.shop.service.ConversationService;
import com.fpt.bom.shop.service.NotificationService;
import com.fpt.core.common.annotation.SkipPermissionCheck;
import com.fpt.core.common.web.Response;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.UUID;

/** Notifications and buyer-side chat with stores. */
@RestController
@RequestMapping("/shop/me")
@RequiredArgsConstructor
@SkipPermissionCheck
public class MeMessagingController {

    private final NotificationService notificationService;
    private final ConversationService conversationService;

    @GetMapping("/notification/search")
    public Response<?> notifications(@Valid @ModelAttribute PagingFilter paging) {
        return Response.ok(notificationService.search(paging));
    }

    @PostMapping("/notification/read")
    public Response<?> read(@RequestBody NotificationReadRequest request) {
        notificationService.read(request);
        return Response.ok();
    }

    @GetMapping("/conversation/list")
    public Response<?> conversations() {
        return Response.ok(conversationService.buyerList());
    }

    @GetMapping("/conversation/{id}/messages")
    public Response<?> messages(@PathVariable UUID id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime after) {
        return Response.ok(conversationService.buyerMessages(id, after));
    }

    @PostMapping("/conversation/start")
    public Response<?> start(@Valid @RequestBody StartConversationRequest request) {
        return Response.ok(conversationService.start(request.storeId()));
    }

    @PostMapping("/conversation/send")
    public Response<?> send(@Valid @RequestBody SendMessageRequest request) {
        return Response.ok(conversationService.buyerSend(request));
    }
}
