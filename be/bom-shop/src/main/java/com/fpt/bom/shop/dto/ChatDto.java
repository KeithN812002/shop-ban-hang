package com.fpt.bom.shop.dto;

import com.fpt.bom.shop.dto.CatalogDto.ProductCard;
import com.fpt.bom.shop.enums.NotificationType;
import com.fpt.bom.shop.enums.SenderRole;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** Notifications, buyer-seller messaging and the AI chatbot. */
public final class ChatDto {

    private ChatDto() {
    }

    public record NotificationResponse(UUID id, NotificationType type, String title, String content, String link,
            Boolean isRead, LocalDateTime createdDate) {
    }

    public record NotificationReadRequest(List<UUID> ids, Boolean all) {
    }

    public record StartConversationRequest(@NotNull(message = "{shop.validation.required}") UUID storeId) {
    }

    public record SendMessageRequest(
            @NotNull(message = "{shop.validation.required}") UUID conversationId,
            @NotBlank(message = "{shop.validation.required}") @Size(max = 2000, message = "{shop.validation.size}")
            String content,
            UUID productId) {
    }

    /** Conversation row shared by the buyer and seller listings. */
    public record ConversationResponse(UUID id, UUID storeId, String storeName, String storeLogoUrl,
            String buyerUsername, String buyerName, String lastMessage, LocalDateTime lastMessageAt,
            int buyerUnread, int sellerUnread) {
    }

    public record MessageResponse(UUID id, UUID conversationId, String senderUsername, SenderRole senderRole,
            String content, UUID productId, ProductCard product, LocalDateTime createdDate, boolean mine) {
    }

    public record ChatMessage(
            @NotBlank(message = "{shop.validation.chat.messages}") String role,
            @NotBlank(message = "{shop.validation.chat.messages}")
            @Size(max = 2000, message = "{shop.validation.chat.messages}") String content) {
    }

    public record ChatRequest(
            @NotEmpty(message = "{shop.validation.chat.messages}")
            @Size(max = 20, message = "{shop.validation.chat.messages}")
            List<@Valid ChatMessage> messages) {
    }

    public record ChatResponse(String reply, List<ProductCard> products) {
    }
}
