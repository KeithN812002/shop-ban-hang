package com.fpt.bom.shop.repository;

import com.fpt.bom.shop.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    List<Message> findTop100ByConversationIdOrderByCreatedDateDesc(UUID conversationId);

    List<Message> findByConversationIdAndCreatedDateAfterOrderByCreatedDateAsc(UUID conversationId,
            LocalDateTime after);
}
