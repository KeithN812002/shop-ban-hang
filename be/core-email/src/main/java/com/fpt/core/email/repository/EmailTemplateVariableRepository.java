package com.fpt.core.email.repository;

import com.fpt.core.email.entity.EmailTemplateVariable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface EmailTemplateVariableRepository extends JpaRepository<EmailTemplateVariable, UUID> {
}
