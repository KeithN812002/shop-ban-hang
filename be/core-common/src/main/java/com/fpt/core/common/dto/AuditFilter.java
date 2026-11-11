package com.fpt.core.common.dto;

import java.time.LocalDateTime;

public interface AuditFilter {

    String getCreatedBy();

    LocalDateTime getCreatedDateFrom();

    LocalDateTime getCreatedDateTo();

    String getUpdatedBy();

    LocalDateTime getUpdatedDateFrom();

    LocalDateTime getUpdatedDateTo();
}
