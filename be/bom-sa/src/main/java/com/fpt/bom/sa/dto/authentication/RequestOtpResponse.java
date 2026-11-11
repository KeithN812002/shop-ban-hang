package com.fpt.bom.sa.dto.authentication;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Author: hoanglm21@fpt.com
 * Date: 1/1/26
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class RequestOtpResponse {
    private int cooldownMinutes;
    private int expireMinutes;
}
