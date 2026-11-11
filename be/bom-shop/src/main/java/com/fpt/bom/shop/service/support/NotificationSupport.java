package com.fpt.bom.shop.service.support;

import com.fpt.bom.shop.entity.Notification;
import com.fpt.bom.shop.enums.NotificationType;
import com.fpt.bom.shop.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.stereotype.Component;

import java.util.Locale;

/**
 * Persists in-app notifications. The text is rendered once, in Vietnamese, from the message bundle so that
 * the stored notification does not depend on the language of the user who triggered it.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationSupport {

    private static final Locale STORED_LOCALE = Locale.forLanguageTag("vi");

    private final NotificationRepository notificationRepository;
    private final MessageSource messageSource;

    /**
     * @param titleKey message key of the title (rendered with {@code args})
     * @param content  optional free text (cancellation reason, ...)
     */
    public void send(String username, NotificationType type, String titleKey, String content, String link,
            Object... args) {
        if (username == null || username.isBlank()) {
            return;
        }
        Notification notification = new Notification();
        notification.setUsername(username);
        notification.setType(type);
        notification.setTitle(TextSupport.truncate(messageSource.getMessage(titleKey, args, titleKey,
                STORED_LOCALE), 300));
        notification.setContent(TextSupport.truncate(content, 1000));
        notification.setLink(link);
        notification.setRead(false);
        notificationRepository.save(notification);
        log.info("Notification queued: user={}, key={}", username, titleKey);
    }
}
