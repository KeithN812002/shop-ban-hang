package com.fpt.core.email.service;

import com.fpt.core.email.dto.emailOutbox.EmailOutboxDetailResponse;
import com.fpt.core.email.dto.emailOutbox.EmailOutboxFilterRequest;
import com.fpt.core.email.dto.emailOutbox.EmailOutboxResponse;
import com.fpt.core.common.dto.PageResult;
import com.fpt.core.email.dto.emailOutbox.EmailOutboxQueueTransfer;

import java.util.List;
import java.util.UUID;

/**
 * Author: hoanglm21@fpt.com
 * Date: 02/06/2026
 */
public interface EmailOutboxService {

    PageResult<EmailOutboxResponse> search(EmailOutboxFilterRequest filter);

    EmailOutboxDetailResponse view(UUID id);

    void resend(UUID id);

    void resendBulk(List<UUID> ids);

    void queueEmail(EmailOutboxQueueTransfer transfer);
}
