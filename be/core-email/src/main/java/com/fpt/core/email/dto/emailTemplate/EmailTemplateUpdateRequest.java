package com.fpt.core.email.dto.emailTemplate;

import com.fpt.core.common.enums.StatusBasic;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

/**
 * Author: hoanglm21@fpt.com
 * Date: 03/06/2026
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class EmailTemplateUpdateRequest {

    @NotNull(message = "{common.id.notNull}")
    private UUID id;

    @NotBlank(message = "{emailTemplate.subjectTemplate.notBlank}")
    private String subjectTemplate;

    @NotBlank(message = "{emailTemplate.bodyTemplate.notBlank}")
    private String bodyTemplate;

    @NotNull(message = "{status.notNull}")
    private StatusBasic status;
}
