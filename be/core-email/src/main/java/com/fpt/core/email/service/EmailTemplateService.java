package com.fpt.core.email.service;

import com.fpt.core.email.dto.emailTemplate.EmailTemplateDetailResponse;
import com.fpt.core.email.dto.emailTemplate.EmailTemplateFilterRequest;
import com.fpt.core.email.dto.emailTemplate.EmailTemplateResponse;
import com.fpt.core.email.dto.emailTemplate.EmailTemplateUpdateRequest;
import com.fpt.core.common.dto.PageResult;

import java.util.List;
import java.util.UUID;

/**
 * Author: hoanglm21@fpt.com
 * Date: 03/06/2026
 */
public interface EmailTemplateService {

    PageResult<EmailTemplateResponse> search(String moduleType, EmailTemplateFilterRequest filter);

    EmailTemplateDetailResponse view(String moduleType, UUID id);

    void update(String moduleType, EmailTemplateUpdateRequest request);

    void active(String moduleType, UUID id);

    void inactive(String moduleType, UUID id);

    void activeBulk(String moduleType, List<UUID> ids);

    void inactiveBulk(String moduleType, List<UUID> ids);
}
