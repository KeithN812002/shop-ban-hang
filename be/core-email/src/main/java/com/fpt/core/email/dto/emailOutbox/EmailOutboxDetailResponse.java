package com.fpt.core.email.dto.emailOutbox;

import com.fpt.core.common.dto.AuditableResponse;
import com.fpt.core.common.enums.StatusEmailOutbox;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Author: hoanglm21@fpt.com
 * Date: 02/06/2026
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class EmailOutboxDetailResponse extends AuditableResponse {

    private UUID id;

    private String eventType;

    private String subject;

    private String receiver;

    private String body;

    private StatusEmailOutbox status;

    private String variables;

    private Integer retryCount;

    private LocalDateTime sentAt;

    private String errorMessage;
}
