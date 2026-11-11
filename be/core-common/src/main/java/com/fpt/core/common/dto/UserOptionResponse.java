package com.fpt.core.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Author: hoanglm21@fpt.com
 * Date: 13/05/2026
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserOptionResponse {

    private String userName;

    private String personalName;
}
