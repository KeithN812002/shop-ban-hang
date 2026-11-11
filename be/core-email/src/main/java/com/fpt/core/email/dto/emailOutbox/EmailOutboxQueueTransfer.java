package com.fpt.core.email.dto.emailOutbox;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Author: hoanglm21@fpt.com
 * Date: 03/06/2026
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EmailOutboxQueueTransfer {

    private String eventType;

    private String receiver;

    private Map<String, String> variablesMap;
}
