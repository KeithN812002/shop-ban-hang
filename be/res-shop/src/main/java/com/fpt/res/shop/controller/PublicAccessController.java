package com.fpt.res.shop.controller;

import com.fpt.bom.shop.dto.AccountDto.RegisterRequest;
import com.fpt.bom.shop.dto.ChatDto.ChatRequest;
import com.fpt.bom.shop.service.AccountService;
import com.fpt.bom.shop.service.ChatbotService;
import com.fpt.core.common.annotation.SkipPermissionCheck;
import com.fpt.core.common.web.RequestClientInfo;
import com.fpt.core.common.web.Response;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Anonymous entry points: self-registration and the shopping assistant. */
@RestController
@RequestMapping("/shop/public")
@RequiredArgsConstructor
@SkipPermissionCheck
public class PublicAccessController {

    private final AccountService accountService;
    private final ChatbotService chatbotService;

    @PostMapping("/auth/register")
    public Response<?> register(@Valid @RequestBody RegisterRequest request) {
        accountService.register(request);
        return Response.ok();
    }

    @PostMapping("/chatbot/chat")
    public Response<?> chat(@Valid @RequestBody ChatRequest request, HttpServletRequest http) {
        return Response.ok(chatbotService.chat(request, RequestClientInfo.getClientIpAddr(http)));
    }
}
