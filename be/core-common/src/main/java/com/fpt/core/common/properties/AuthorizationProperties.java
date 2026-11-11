package com.fpt.core.common.properties;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

@Data
@ConfigurationProperties(prefix = "security")
public class AuthorizationProperties {
    private List<String> whiteList = new ArrayList<>();
    private boolean skipAllPermissions = false;
}
