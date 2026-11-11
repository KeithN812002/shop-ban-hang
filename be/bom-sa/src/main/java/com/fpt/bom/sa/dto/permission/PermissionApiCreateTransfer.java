package com.fpt.bom.sa.dto.permission;

import com.fpt.core.common.enums.StatusBasic;
import com.fpt.core.common.enums.MethodEnum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Author: hoanglm21@fpt.com
 * Date: 1/1/26
 */
@SuppressWarnings("unused")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionApiCreateTransfer {

    private String name;

    private String uri;

    private MethodEnum method;

    private Integer sortOrder;

    private StatusBasic status;
}
