package com.fpt.bom.shop.service.impl;

import com.fpt.bom.shop.dto.ChatDto.NotificationReadRequest;
import com.fpt.bom.shop.dto.ChatDto.NotificationResponse;
import com.fpt.bom.shop.entity.Notification;
import com.fpt.bom.shop.repository.NotificationRepository;
import com.fpt.bom.shop.service.NotificationService;
import com.fpt.bom.shop.service.support.AccessSupport;
import com.fpt.core.common.dto.PageResult;
import com.fpt.core.common.dto.PagingBase;
import com.fpt.core.persistence.util.PageableUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final AccessSupport accessSupport;

    @Override
    @Transactional(readOnly = true)
    public PageResult<NotificationResponse> search(PagingBase paging) {
        Pageable pageable = PageableUtils.pageable(paging.getPageNumber() - 1, paging.getPageSize(),
                "createdDate:DESC");
        Page<Notification> page = notificationRepository.findByUsername(accessSupport.currentUsername(),
                Objects.requireNonNull(pageable));
        return PageableUtils.toPageResult(page, n -> new NotificationResponse(n.getId(), n.getType(),
                n.getTitle(), n.getContent(), n.getLink(), n.isRead(), n.getCreatedDate()));
    }

    @Override
    @Transactional
    public void read(NotificationReadRequest request) {
        String username = accessSupport.currentUsername();
        if (Boolean.TRUE.equals(request.all())) {
            notificationRepository.markAllRead(username);
        } else if (request.ids() != null && !request.ids().isEmpty()) {
            notificationRepository.markRead(username, request.ids());
        }
        log.info("Notifications marked read: user={}", username);
    }
}
