package com.fpt.core.email.service.impl;

import com.fpt.core.email.dto.emailTemplate.EmailTemplateDetailResponse;
import com.fpt.core.email.dto.emailTemplate.EmailTemplateFilterRequest;
import com.fpt.core.email.dto.emailTemplate.EmailTemplateResponse;
import com.fpt.core.email.dto.emailTemplate.EmailTemplateUpdateRequest;
import com.fpt.core.email.dto.emailTemplate.TemplateVariableResponse;
import com.fpt.core.email.entity.EmailTemplateVariable;
import com.fpt.core.email.repository.EmailTemplateVariableRepository;
import com.fpt.core.email.entity.EmailTemplate;
import com.fpt.core.email.repository.EmailTemplateRepository;
import com.fpt.core.email.service.EmailTemplateService;
import com.fpt.core.email.service.support.EmailTemplateModuleSupport;
import com.fpt.core.common.dto.PageResult;
import com.fpt.core.common.enums.StatusBasic;
import com.fpt.core.common.exception.BaseException;
import com.fpt.core.persistence.spec.SpecificationBuilder;
import com.fpt.core.persistence.util.PageableUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.Arrays;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.fpt.core.persistence.spec.JpaFieldSpecifications.*;
import static com.fpt.core.persistence.spec.JpaStringSpecifications.like;

/**
 * Author: hoanglm21@fpt.com
 * Date: 03/06/2026
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class EmailTemplateServiceImpl implements EmailTemplateService {

    private final EmailTemplateRepository emailTemplateRepository;
    private final EmailTemplateVariableRepository templateVariableRepository;
    private final ModelMapper modelMapper;
    private final StringRedisTemplate stringRedisTemplate;

    @Override
    @Transactional(readOnly = true)
    public PageResult<EmailTemplateResponse> search(String moduleType, EmailTemplateFilterRequest filter) {
        String module = EmailTemplateModuleSupport.resolveModule(moduleType);
        Pageable pageable = PageableUtils.pageable(filter.getPageNumber() - 1, filter.getPageSize(),
                filter.getSortExpr());
        Page<EmailTemplate> page = emailTemplateRepository.findAll(buildSearchSpec(module, filter),
                Objects.requireNonNull(pageable));
        return PageableUtils.toPageResult(page, entity -> modelMapper.map(entity, EmailTemplateResponse.class));
    }

    @Override
    @Transactional(readOnly = true)
    public EmailTemplateDetailResponse view(String moduleType, UUID id) {
        String module = EmailTemplateModuleSupport.resolveModule(moduleType);
        EmailTemplate entity = requireTemplate(module, id);
        EmailTemplateDetailResponse response = modelMapper.map(entity, EmailTemplateDetailResponse.class);
        response.setVariables(toVariableResponses(entity.getVariables()));
        return response;
    }

    @Override
    public void update(String moduleType, EmailTemplateUpdateRequest request) {
        String module = EmailTemplateModuleSupport.resolveModule(moduleType);
        EmailTemplate entity = requireTemplate(module, request.getId());
        validateVariables(entity, request.getSubjectTemplate(), request.getBodyTemplate());
        modelMapper.map(request, entity);
        emailTemplateRepository.save(Objects.requireNonNull(entity));
        evictCache(entity);
    }

    @Override
    public void active(String moduleType, UUID id) {
        String module = EmailTemplateModuleSupport.resolveModule(moduleType);
        changeStatus(module, id, StatusBasic.ACTIVE);
    }

    @Override
    public void inactive(String moduleType, UUID id) {
        String module = EmailTemplateModuleSupport.resolveModule(moduleType);
        changeStatus(module, id, StatusBasic.INACTIVE);
    }

    @Override
    public void activeBulk(String moduleType, List<UUID> ids) {
        String module = EmailTemplateModuleSupport.resolveModule(moduleType);
        changeStatusBulk(module, ids, StatusBasic.ACTIVE);
    }

    @Override
    public void inactiveBulk(String moduleType, List<UUID> ids) {
        String module = EmailTemplateModuleSupport.resolveModule(moduleType);
        changeStatusBulk(module, ids, StatusBasic.INACTIVE);
    }

    private void changeStatusBulk(String module, List<UUID> ids, StatusBasic status) {
        List<EmailTemplate> entities = emailTemplateRepository.findAllById(Objects.requireNonNull(ids));
        if (entities.size() != ids.size()) {
            throw new BaseException("APP_DATA404");
        }
        entities.forEach(entity -> requireModule(entity, module));
        entities.forEach(entity -> entity.setStatus(status));
        emailTemplateRepository.saveAll(entities);
        entities.forEach(this::evictCache);
    }

    private void changeStatus(String module, UUID id, StatusBasic status) {
        EmailTemplate entity = requireTemplate(module, id);
        entity.setStatus(status);
        emailTemplateRepository.save(entity);
        evictCache(entity);
    }

    private void evictCache(EmailTemplate entity) {
        String cacheKey = "email:template:" + entity.getEventType();
        try {
            stringRedisTemplate.delete(cacheKey);
            log.info("Evicted email template cache key: {}", cacheKey);
        } catch (Exception e) {
            log.error("Failed to evict cache key from Redis: {}", cacheKey, e);
        }
    }

    private void validateVariables(EmailTemplate entity, String subjectTemplate, String bodyTemplate) {
        String[] supportedVars = entity.getVariables();
        if (supportedVars == null) {
            supportedVars = new String[0];
        }
        Set<String> supportedSet = new HashSet<>(Arrays.asList(supportedVars));

        Set<String> unsupported = new LinkedHashSet<>();
        extractAndCheckVariables(subjectTemplate, supportedSet, unsupported);
        extractAndCheckVariables(bodyTemplate, supportedSet, unsupported);

        if (!unsupported.isEmpty()) {
            throw new BaseException("emailTemplate.unsupportedVariables", String.join(", ", unsupported));
        }
    }

    private void extractAndCheckVariables(String content, Set<String> supportedSet, Set<String> unsupported) {
        if (content == null || content.isEmpty()) {
            return;
        }
        Pattern pattern = Pattern.compile("\\{[^}]+}");
        Matcher matcher = pattern.matcher(content);
        while (matcher.find()) {
            String var = matcher.group();
            if (!supportedSet.contains(var)) {
                unsupported.add(var);
            }
        }
    }

    private List<TemplateVariableResponse> toVariableResponses(String[] variables) {
        if (variables == null || variables.length == 0) {
            return List.of();
        }
        Map<String, String> variableLabels = templateVariableRepository
                .findAll()
                .stream()
                .collect(Collectors.toMap(EmailTemplateVariable::getCode, EmailTemplateVariable::getLabel));

        return Arrays.stream(variables)
                .map(EmailTemplateServiceImpl::stripBraces)
                .map(code -> new TemplateVariableResponse(code, variableLabels.get(code)))
                .toList();
    }

    // sa_email_template.variables stores tokens with braces, the label dictionary stores bare codes
    private static String stripBraces(String token) {
        return token.startsWith("{") && token.endsWith("}")
                ? token.substring(1, token.length() - 1)
                : token;
    }

    // A template can only be touched from the module that owns it
    private EmailTemplate requireTemplate(String module, UUID id) {
        EmailTemplate entity = emailTemplateRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new BaseException("APP_DATA404"));
        requireModule(entity, module);
        return entity;
    }

    private void requireModule(EmailTemplate entity, String module) {
        if (!entity.getModule().equals(module)) {
            throw new BaseException("emailTemplate.moduleMismatch");
        }
    }

    private Specification<EmailTemplate> buildSearchSpec(String module,
            EmailTemplateFilterRequest filter) {
        SpecificationBuilder<EmailTemplate> builder = new SpecificationBuilder<>();
        builder.and(eq("module", module));
        if (filter == null)
            return builder.build();

        builder.and(in("eventType", filter.getEventType()));
        builder.and(like("subjectTemplate", filter.getSubjectTemplate()));
        builder.and(in("status", filter.getStatus()));
        builder.and(auditFields(filter));

        return builder.build();
    }
}
