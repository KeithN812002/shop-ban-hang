package com.fpt.bom.sa.dto.permission;

import com.fpt.core.common.enums.MethodEnum;

import java.util.UUID;

public interface PermissionEndpointItem {

    UUID getId();

    MethodEnum getMethod();

    String getUri();

    void setUri(String uri);
}
