package com.fpt.bom.shop.service.impl;

import com.fpt.bom.shop.dto.CatalogDto.ProductCard;
import com.fpt.bom.shop.dto.ChatDto.ConversationResponse;
import com.fpt.bom.shop.dto.ChatDto.MessageResponse;
import com.fpt.bom.shop.dto.ChatDto.SendMessageRequest;
import com.fpt.bom.shop.entity.Conversation;
import com.fpt.bom.shop.entity.Message;
import com.fpt.bom.shop.entity.Product;
import com.fpt.bom.shop.entity.Store;
import com.fpt.bom.shop.enums.ApprovalStatus;
import com.fpt.bom.shop.enums.SenderRole;
import com.fpt.bom.shop.repository.ConversationRepository;
import com.fpt.bom.shop.repository.MessageRepository;
import com.fpt.bom.shop.repository.ProductRepository;
import com.fpt.bom.shop.repository.StoreRepository;
import com.fpt.bom.shop.service.ConversationService;
import com.fpt.bom.shop.service.support.AccessSupport;
import com.fpt.bom.shop.service.support.ShopMapper;
import com.fpt.bom.shop.service.support.TextSupport;
import com.fpt.bom.shop.service.support.UserDirectory;
import com.fpt.core.common.exception.BaseException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConversationServiceImpl implements ConversationService {

    private static final int PREVIEW_LENGTH = 200;

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final StoreRepository storeRepository;
    private final ProductRepository productRepository;
    private final AccessSupport accessSupport;
    private final UserDirectory userDirectory;
    private final ShopMapper shopMapper;

    @Override
    @Transactional(readOnly = true)
    public List<ConversationResponse> buyerList() {
        String username = accessSupport.currentUsername();
        return toResponses(conversationRepository.findByBuyerUsernameOrderByLastMessageAtDesc(username), true);
    }

    @Override
    @Transactional
    public List<MessageResponse> buyerMessages(UUID conversationId, LocalDateTime after) {
        String username = accessSupport.currentUsername();
        Conversation conversation = conversationRepository
                .findByIdAndBuyerUsername(Objects.requireNonNull(conversationId), username)
                .orElseThrow(() -> new BaseException("APP_DATA404"));
        List<MessageResponse> messages = loadMessages(conversation, after, username);
        conversationRepository.clearBuyerUnread(conversation.getId());
        return messages;
    }

    @Override
    @Transactional
    public ConversationResponse start(UUID storeId) {
        String username = accessSupport.currentUsername();
        Store store = storeRepository.findByIdAndIsDeletedFalse(Objects.requireNonNull(storeId))
                .filter(s -> s.getStatus() == ApprovalStatus.ACTIVE)
                .orElseThrow(() -> new BaseException("APP_DATA404"));
        if (store.getOwnerUsername().equals(username)) {
            throw new BaseException("shop.chat.ownStore");
        }
        Conversation conversation = conversationRepository.findByBuyerUsernameAndStoreId(username, storeId)
                .orElseGet(() -> {
                    Conversation fresh = new Conversation();
                    fresh.setBuyerUsername(username);
                    fresh.setStoreId(storeId);
                    return conversationRepository.save(fresh);
                });
        return toResponses(List.of(conversation), true).get(0);
    }

    @Override
    @Transactional
    public MessageResponse buyerSend(SendMessageRequest request) {
        String username = accessSupport.currentUsername();
        Conversation conversation = conversationRepository
                .findByIdAndBuyerUsername(Objects.requireNonNull(request.conversationId()), username)
                .orElseThrow(() -> new BaseException("APP_DATA404"));
        Message message = save(conversation, username, SenderRole.BUYER, request);
        conversationRepository.touchFromBuyer(conversation.getId(), preview(message), LocalDateTime.now());
        return toResponse(message, username, productCard(message));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConversationResponse> sellerList() {
        Store store = accessSupport.requireActiveStore(accessSupport.currentUsername());
        return toResponses(conversationRepository.findByStoreIdOrderByLastMessageAtDesc(store.getId()), false);
    }

    @Override
    @Transactional
    public List<MessageResponse> sellerMessages(UUID conversationId, LocalDateTime after) {
        String username = accessSupport.currentUsername();
        Store store = accessSupport.requireActiveStore(username);
        Conversation conversation = conversationRepository
                .findByIdAndStoreId(Objects.requireNonNull(conversationId), store.getId())
                .orElseThrow(() -> new BaseException("APP_DATA404"));
        List<MessageResponse> messages = loadMessages(conversation, after, username);
        conversationRepository.clearSellerUnread(conversation.getId());
        return messages;
    }

    @Override
    @Transactional
    public MessageResponse sellerSend(SendMessageRequest request) {
        String username = accessSupport.currentUsername();
        Store store = accessSupport.requireActiveStore(username);
        Conversation conversation = conversationRepository
                .findByIdAndStoreId(Objects.requireNonNull(request.conversationId()), store.getId())
                .orElseThrow(() -> new BaseException("APP_DATA404"));
        Message message = save(conversation, username, SenderRole.SELLER, request);
        conversationRepository.touchFromSeller(conversation.getId(), preview(message), LocalDateTime.now());
        return toResponse(message, username, productCard(message));
    }

    private Message save(Conversation conversation, String sender, SenderRole role, SendMessageRequest request) {
        if (request.productId() != null) {
            Product product = productRepository.findByIdAndIsDeletedFalse(request.productId())
                    .orElseThrow(() -> new BaseException("shop.chat.productInvalid"));
            if (!product.getStoreId().equals(conversation.getStoreId())) {
                throw new BaseException("shop.chat.productInvalid");
            }
        }
        Message message = new Message();
        message.setConversationId(conversation.getId());
        message.setSenderUsername(sender);
        message.setSenderRole(role);
        message.setContent(request.content().trim());
        message.setProductId(request.productId());
        Message saved = messageRepository.save(message);
        messageRepository.flush();
        log.info("Message sent: conversation={}, role={}", conversation.getId(), role);
        return saved;
    }

    private List<MessageResponse> loadMessages(Conversation conversation, LocalDateTime after, String viewer) {
        List<Message> messages;
        if (after != null) {
            messages = messageRepository.findByConversationIdAndCreatedDateAfterOrderByCreatedDateAsc(
                    conversation.getId(), after);
        } else {
            messages = new ArrayList<>(messageRepository
                    .findTop100ByConversationIdOrderByCreatedDateDesc(conversation.getId()));
            Collections.reverse(messages);
        }
        Map<UUID, ProductCard> cards = shopMapper.toCards(productRepository.findAllById(messages.stream()
                .map(Message::getProductId).filter(Objects::nonNull).distinct().toList())).stream()
                .collect(Collectors.toMap(ProductCard::id, Function.identity()));
        return messages.stream()
                .map(m -> toResponse(m, viewer, m.getProductId() != null ? cards.get(m.getProductId()) : null))
                .toList();
    }

    private ProductCard productCard(Message message) {
        if (message.getProductId() == null) {
            return null;
        }
        return productRepository.findById(message.getProductId())
                .map(p -> shopMapper.toCards(List.of(p)).get(0)).orElse(null);
    }

    private MessageResponse toResponse(Message m, String viewer, ProductCard product) {
        return new MessageResponse(m.getId(), m.getConversationId(), m.getSenderUsername(), m.getSenderRole(),
                m.getContent(), m.getProductId(), product, m.getCreatedDate(),
                m.getSenderUsername().equals(viewer));
    }

    private String preview(Message message) {
        return TextSupport.truncate(message.getContent(), PREVIEW_LENGTH);
    }

    private List<ConversationResponse> toResponses(List<Conversation> conversations, boolean buyerView) {
        if (conversations.isEmpty()) {
            return List.of();
        }
        Map<UUID, Store> stores = storeRepository
                .findAllById(conversations.stream().map(Conversation::getStoreId).distinct().toList()).stream()
                .collect(Collectors.toMap(Store::getId, Function.identity()));
        Map<String, String> names = userDirectory
                .displayNames(conversations.stream().map(Conversation::getBuyerUsername).toList());
        return conversations.stream()
                .sorted(Comparator.comparing(Conversation::getLastMessageAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(c -> {
                    Store store = stores.get(c.getStoreId());
                    return new ConversationResponse(c.getId(), c.getStoreId(),
                            store != null ? store.getName() : null, store != null ? store.getLogoUrl() : null,
                            c.getBuyerUsername(), names.get(c.getBuyerUsername()), c.getLastMessage(),
                            c.getLastMessageAt(), c.getBuyerUnread(), c.getSellerUnread());
                }).toList();
    }
}
