package com.fpt.core.email.service.impl;

import com.fpt.core.email.dto.emailOutbox.EmailOutboxQueueTransfer;
import com.fpt.core.email.dto.emailOutbox.EmailOutboxDetailResponse;
import com.fpt.core.email.dto.emailOutbox.EmailOutboxFilterRequest;
import com.fpt.core.email.dto.emailOutbox.EmailOutboxResponse;
import com.fpt.core.email.entity.EmailOutbox;
import com.fpt.core.email.repository.EmailOutboxRepository;
import com.fpt.core.common.enums.StatusBasic;
import com.fpt.core.email.entity.EmailTemplate;
import com.fpt.core.email.repository.EmailTemplateRepository;
import com.fpt.core.email.service.EmailOutboxService;
import com.fpt.core.common.util.JsonUtils;
import java.util.Map;
import com.fpt.core.common.dto.PageResult;
import com.fpt.core.common.enums.StatusEmailOutbox;
import com.fpt.core.common.exception.BaseException;
import com.fpt.core.persistence.spec.SpecificationBuilder;
import com.fpt.core.persistence.util.PageableUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

import static com.fpt.core.persistence.spec.JpaFieldSpecifications.*;
import static com.fpt.core.persistence.spec.JpaStringSpecifications.like;

/**
 * Author: hoanglm21@fpt.com
 * Date: 02/06/2026
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class EmailOutboxServiceImpl implements EmailOutboxService {

    private final EmailOutboxRepository emailOutboxRepository;
    private final EmailTemplateRepository emailTemplateRepository;
    private final ModelMapper modelMapper;

    @Override
    @Transactional(readOnly = true)
    public PageResult<EmailOutboxResponse> search(EmailOutboxFilterRequest filter) {
        Pageable pageable = PageableUtils.pageable(filter.getPageNumber() - 1, filter.getPageSize(),
                filter.getSortExpr());
        Page<EmailOutbox> page = emailOutboxRepository.findAll(buildSearchSpec(filter),
                Objects.requireNonNull(pageable));
        return PageableUtils.toPageResult(page, entity -> modelMapper.map(entity, EmailOutboxResponse.class));
    }

    @Override
    @Transactional(readOnly = true)
    public EmailOutboxDetailResponse view(UUID id) {
        EmailOutbox emailOutbox = emailOutboxRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new BaseException("APP_DATA404"));
        EmailOutboxDetailResponse response = modelMapper.map(emailOutbox, EmailOutboxDetailResponse.class);
        response.setVariables(maskPasswordInVariables(response.getVariables()));
        return response;
    }

    @Override
    public void resend(UUID id) {
        EmailOutbox emailOutbox = emailOutboxRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new BaseException("APP_DATA404"));
        resetForResend(emailOutbox);
        emailOutboxRepository.save(Objects.requireNonNull(emailOutbox));
    }

    @Override
    public void resendBulk(List<UUID> ids) {
        List<EmailOutbox> emailOutboxes = emailOutboxRepository.findAllById(Objects.requireNonNull(ids));
        if (emailOutboxes.size() != ids.size()) {
            throw new BaseException("APP_DATA404");
        }

        for (EmailOutbox emailOutbox : emailOutboxes) {
            resetForResend(emailOutbox);
        }

        emailOutboxRepository.saveAll(emailOutboxes);
    }

    @Override
    public void queueEmail(EmailOutboxQueueTransfer transfer) {
        if (transfer.getEventType() == null) {
            throw new BaseException("email.eventType.notNull");
        }
        if (transfer.getReceiver() == null || transfer.getReceiver().isBlank()) {
            throw new BaseException("email.receiver.notBlank");
        }

        EmailTemplate template = emailTemplateRepository.findByEventType(transfer.getEventType())
                .orElse(null);

        if (template != null && template.getStatus() == StatusBasic.INACTIVE) {
            log.info("Skipping queuing email outbox task: Template for event type {} is INACTIVE.",
                    transfer.getEventType());
            return;
        }

        EmailOutbox outbox = modelMapper.map(transfer, EmailOutbox.class);
        Map<String, String> variablesMap = transfer.getVariablesMap();
        String variablesJson = (variablesMap != null && !variablesMap.isEmpty())
                ? JsonUtils.convertObjectToJsonString(variablesMap)
                : "{}";
        outbox.setVariables(variablesJson);
        outbox.setStatus(StatusEmailOutbox.NEW);
        outbox.setRetryCount(0);

        emailOutboxRepository.save(outbox);
    }

    private void resetForResend(EmailOutbox emailOutbox) {
        if (emailOutbox.getStatus() != StatusEmailOutbox.FAIL
                && emailOutbox.getStatus() != StatusEmailOutbox.CANCELLED) {
            throw new BaseException("email.outbox.resend.only.fail.or.cancelled");
        }
        emailOutbox.setStatus(StatusEmailOutbox.PENDING);
        emailOutbox.setRetryCount(0);
        emailOutbox.setSentAt(null);
        emailOutbox.setErrorMessage(null);
    }

    @SuppressWarnings("java:S2068")
    private String maskPasswordInVariables(String variablesJson) {
        if (variablesJson == null || (!variablesJson.contains("password") && !variablesJson.contains("otp"))) {
            return variablesJson;
        }
        try {
            Map<String, Object> map = JsonUtils.convertJsonStringToMap(variablesJson);
            if (!map.isEmpty()) {
                boolean changed = false;
                if (map.containsKey("{password}")) {
                    map.put("{password}", "************");
                    changed = true;
                }
                if (map.containsKey("password")) {
                    map.put("password", "************");
                    changed = true;
                }
                if (map.containsKey("{otp}")) {
                    map.put("{otp}", "******");
                    changed = true;
                }
                if (map.containsKey("otp")) {
                    map.put("otp", "******");
                    changed = true;
                }
                if (changed) {
                    return JsonUtils.convertObjectToJsonString(map);
                }
            }
        } catch (Exception e) {
            log.error("Failed to mask sensitive fields in variables: {}", e.getMessage());
        }
        return variablesJson;
    }

    private Specification<EmailOutbox> buildSearchSpec(EmailOutboxFilterRequest filter) {
        SpecificationBuilder<EmailOutbox> builder = new SpecificationBuilder<>();
        if (filter == null)
            return builder.build();

        builder.and(in("eventType", filter.getEventType()));
        builder.and(like("subject", filter.getSubject()));
        builder.and(like("receiver", filter.getReceiver()));
        builder.and(in("status", filter.getStatus()));
        builder.and(between("retryCount", filter.getRetryCountFrom(), filter.getRetryCountTo()));
        builder.and(auditFields(filter));
        builder.and(between("sentAt", filter.getSentAtFrom(), filter.getSentAtTo()));

        return builder.build();
    }
}
