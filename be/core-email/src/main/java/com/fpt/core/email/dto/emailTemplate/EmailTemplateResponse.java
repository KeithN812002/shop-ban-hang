package com.fpt.core.email.dto.emailTemplate;

import com.fpt.core.common.dto.AuditableResponse;
import com.fpt.core.common.enums.StatusBasic;
import lombok.*;

import java.util.UUID;

/**
 * Author: hoanglm21@fpt.com
 * Date: 03/06/2026
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class EmailTemplateResponse extends AuditableResponse {

    private UUID id;

    private String eventType;

    private String subjectTemplate;

    private StatusBasic status;
}
