package com.fpt.core.email.repository;

import com.fpt.core.email.entity.EmailTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Author: hoanglm21@fpt.com
 * Date: 03/06/2026
 */
@Repository
public interface EmailTemplateRepository extends JpaRepository<EmailTemplate, UUID>, JpaSpecificationExecutor<EmailTemplate> {
    Optional<EmailTemplate> findByEventType(String eventType);
}
