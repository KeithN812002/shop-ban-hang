package com.fpt.core.email.repository;

import com.fpt.core.email.entity.EmailOutbox;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Author: hoanglm21@fpt.com
 * Date: 02/06/2026
 */
@Repository
public interface EmailOutboxRepository extends JpaRepository<EmailOutbox, UUID>, JpaSpecificationExecutor<EmailOutbox> {
}
