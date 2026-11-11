package com.fpt.bom.shop.service;

import com.fpt.bom.shop.dto.ChatDto.ConversationResponse;
import com.fpt.bom.shop.dto.ChatDto.MessageResponse;
import com.fpt.bom.shop.dto.ChatDto.SendMessageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** Buyer-seller messaging; ownership of a conversation always comes from the caller, never from the body. */
public interface ConversationService {

    // ---- buyer ----

    List<ConversationResponse> buyerList();

    /** Messages oldest first (the last 100, or everything after {@code after}); marks the buyer side read. */
    List<MessageResponse> buyerMessages(UUID conversationId, LocalDateTime after);

    /** Opens (or returns the existing) conversation with a store. */
    ConversationResponse start(UUID storeId);

    MessageResponse buyerSend(SendMessageRequest request);

    // ---- seller ----

    List<ConversationResponse> sellerList();

    List<MessageResponse> sellerMessages(UUID conversationId, LocalDateTime after);

    MessageResponse sellerSend(SendMessageRequest request);
}
