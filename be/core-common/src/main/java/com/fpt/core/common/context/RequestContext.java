package com.fpt.core.common.context;

import java.time.Instant;

import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Component;
import org.springframework.web.context.WebApplicationContext;

import lombok.Data;
import lombok.experimental.Accessors;

@Component
@Data
@Accessors(fluent = true)
@Scope(value = WebApplicationContext.SCOPE_REQUEST, proxyMode = ScopedProxyMode.TARGET_CLASS)
public class RequestContext {
    private String iss;
    private Instant exp;
    private Instant iat;
    private String azp;
    private String sub;
    private String preferredUsername;

    private String menuCode;
    private String menuAction;
    private String ipAddress;
    private String userAgent;
    private String urlRequest;
    private String urlReferer;
}
