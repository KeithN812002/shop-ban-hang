package com.fpt.bom.sa.dto.authentication;
import com.fpt.core.common.enums.MethodEnum;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Author: hoanglm21@fpt.com
 * Date: 1/1/26
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionBeView {

    private String uri;

    private MethodEnum method;
}
