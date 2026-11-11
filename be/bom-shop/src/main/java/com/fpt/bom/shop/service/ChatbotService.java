package com.fpt.bom.shop.service;

import com.fpt.bom.shop.dto.ChatDto.ChatRequest;
import com.fpt.bom.shop.dto.ChatDto.ChatResponse;

public interface ChatbotService {

    /**
     * Answers a shopper's question about the shop. Uses the AI service with catalogue tools when configured
     * and healthy, otherwise the rule-based engine. Rate limited per client IP.
     */
    ChatResponse chat(ChatRequest request, String clientIp);
}
