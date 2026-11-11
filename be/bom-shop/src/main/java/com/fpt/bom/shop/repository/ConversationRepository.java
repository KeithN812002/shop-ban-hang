package com.fpt.bom.shop.repository;

import com.fpt.bom.shop.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    Optional<Conversation> findByBuyerUsernameAndStoreId(String buyerUsername, UUID storeId);

    Optional<Conversation> findByIdAndBuyerUsername(UUID id, String buyerUsername);

    Optional<Conversation> findByIdAndStoreId(UUID id, UUID storeId);

    List<Conversation> findByBuyerUsernameOrderByLastMessageAtDesc(String buyerUsername);

    List<Conversation> findByStoreIdOrderByLastMessageAtDesc(UUID storeId);

    /** Buyer wrote: bump the seller's unread counter atomically. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE Conversation c SET c.sellerUnread = c.sellerUnread + 1, c.lastMessage = :preview,
                c.lastMessageAt = :at WHERE c.id = :id
            """)
    void touchFromBuyer(@Param("id") UUID id, @Param("preview") String preview, @Param("at") LocalDateTime at);

    /** Seller wrote: bump the buyer's unread counter atomically. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE Conversation c SET c.buyerUnread = c.buyerUnread + 1, c.lastMessage = :preview,
                c.lastMessageAt = :at WHERE c.id = :id
            """)
    void touchFromSeller(@Param("id") UUID id, @Param("preview") String preview, @Param("at") LocalDateTime at);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Conversation c SET c.buyerUnread = 0 WHERE c.id = :id")
    void clearBuyerUnread(@Param("id") UUID id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Conversation c SET c.sellerUnread = 0 WHERE c.id = :id")
    void clearSellerUnread(@Param("id") UUID id);
}
