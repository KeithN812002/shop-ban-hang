package com.fpt.bom.shop.service;

import com.fpt.bom.shop.dto.ChatDto.NotificationReadRequest;
import com.fpt.bom.shop.dto.ChatDto.NotificationResponse;
import com.fpt.core.common.dto.PageResult;
import com.fpt.core.common.dto.PagingBase;

public interface NotificationService {

    /** The caller's notifications, newest first. */
    PageResult<NotificationResponse> search(PagingBase paging);

    /** Marks the given ids (only the caller's own) or everything as read. */
    void read(NotificationReadRequest request);
}
