package com.fpt.core.email.dto.emailTemplate;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TemplateVariableResponse {

    private String code;

    private String label;
}
