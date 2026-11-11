package com.fpt.core.security.filter;

import java.io.IOException;
import java.lang.annotation.Annotation;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import com.fpt.core.common.annotation.ClientCredentialApi;
import com.fpt.core.common.annotation.SkipPermissionCheck;
import com.fpt.core.common.constant.Constants;
import com.fpt.core.common.constant.UserCacheKeys;
import com.fpt.core.common.enums.ErrorEnum;
import com.fpt.core.common.properties.AuthorizationProperties;
import com.fpt.core.cache.service.CacheService;
import com.fpt.core.common.context.RequestContext;
import com.fpt.core.common.util.JsonUtils;
import com.fpt.core.common.util.MessageResolver;
import com.fpt.core.common.util.TraceUtils;
import com.fpt.core.common.web.Response;
import com.fpt.core.common.web.RequestClientInfo;
import com.fpt.core.security.permission.UserPermissionProvider;
import com.fpt.core.security.util.TokenUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.jspecify.annotations.NonNull;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.GenericFilterBean;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerExecutionChain;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

public class CustomAuthorizationFilter extends GenericFilterBean {

    private static final Logger log = LoggerFactory.getLogger(CustomAuthorizationFilter.class);
    private static final AntPathMatcher ANT_PATH_MATCHER = new AntPathMatcher();
    private static final String PERMISSION_FIELD_METHOD = "method";
    private static final String PERMISSION_FIELD_URI = "uri";

    private final List<String> securityConfigWhitelist;
    private final AuthorizationProperties authorizationProperties;
    private final ApplicationContext applicationContext;
    private final Map<String, RequestMappingHandlerMapping> handlerMappings;
    private final CacheService cacheService;
    private final MessageResolver messageResolver;
    private final UserPermissionProvider permissionProvider;

    public CustomAuthorizationFilter(List<String> securityConfigWhitelist,
            AuthorizationProperties authorizationProperties,
            ApplicationContext applicationContext,
            Map<String, RequestMappingHandlerMapping> handlerMappings,
            CacheService cacheService,
            MessageResolver messageResolver,
            UserPermissionProvider permissionProvider) {
        this.securityConfigWhitelist = securityConfigWhitelist != null ? securityConfigWhitelist
                : Collections.emptyList();
        this.authorizationProperties = authorizationProperties;
        this.applicationContext = applicationContext;
        this.handlerMappings = handlerMappings != null ? handlerMappings : Collections.emptyMap();
        this.cacheService = cacheService;
        this.messageResolver = messageResolver;
        this.permissionProvider = permissionProvider;
    }

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) res;

        if (isPreflight(request)) {
            response.setStatus(HttpServletResponse.SC_OK);
            chain.doFilter(req, res);
            return;
        }

        String token = extractBearerToken(request);
        Map<String, Object> tokenPayload = token != null ? tryParsePayload(token) : null;

        if (tokenPayload != null && isBlacklisted(tokenPayload)) {
            writeError(response, Constants.SECURITY_FILTER.ERROR_CODE_TOKEN_REVOKED, HttpStatus.UNAUTHORIZED);
            return;
        }

        if (token != null && isClientCredentialToken(tokenPayload)) {
            String uri = request.getRequestURI();
            boolean allowedForClientCredential = isWhitelistedUrl(uri)
                    || getHandlerAnnotation(request, ClientCredentialApi.class) != null;
            if (!allowedForClientCredential) {
                log.warn("Client-credential token rejected for endpoint not marked @ClientCredentialApi: {} {}",
                        request.getMethod(), uri);
                writeError(response, Constants.SECURITY_FILTER.ERROR_CODE_ACCESS_DENIED, HttpStatus.FORBIDDEN);
                return;
            }
            chain.doFilter(req, res);
            return;
        }

        if (shouldBypassAuthorization(request)) {
            chain.doFilter(req, res);
            return;
        }

        if (!apiExists(request)) {
            writeError(response, Constants.SECURITY_FILTER.ERROR_CODE_API_NOT_FOUND, HttpStatus.NOT_FOUND);
            return;
        }

        if (authorizationProperties.isSkipAllPermissions()
                || checkPermission(request, token, tokenPayload)) {
            chain.doFilter(req, response);
            return;
        }

        log.warn("Access denied for request: method={}, uri={}, contextPath={}, servletPath={}",
                request.getMethod(), request.getRequestURI(), request.getContextPath(), request.getServletPath());
        writeError(response, Constants.SECURITY_FILTER.ERROR_CODE_ACCESS_DENIED, HttpStatus.FORBIDDEN);
    }

    private boolean isPreflight(HttpServletRequest request) {
        return HttpMethod.OPTIONS.name().equalsIgnoreCase(request.getMethod());
    }

    private String extractBearerToken(HttpServletRequest request) {
        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (StringUtils.isBlank(authorization)
                || !authorization.startsWith(Constants.REQUEST_HEADER.BEARER)) {
            return null;
        }
        return StringUtils.substring(authorization, Constants.REQUEST_HEADER.BEARER.length());
    }

    private Map<String, Object> tryParsePayload(String token) {
        try {
            return TokenUtils.getPayload(token);
        } catch (Exception e) {
            log.warn("Failed to parse token payload", e);
            return null;
        }
    }

    private boolean isBlacklisted(Map<String, Object> payload) {
        try {
            String jti = getStringClaim(payload, Constants.SECURITY_FILTER.JWT_JTI);
            if (StringUtils.isNotBlank(jti) && StringUtils.isNotBlank(
                    cacheService.getString(Constants.SECURITY_FILTER.REDIS_KEY_TOKEN_BLACKLIST_PREFIX + jti))) {
                log.warn("Token jti {} is blacklisted - denying access", jti);
                return true;
            }

            String username = getStringClaim(payload, Constants.JWT_CLAIMS.USER_NAME);
            if (StringUtils.isNotBlank(username) && StringUtils.isNotBlank(
                    cacheService.getString(Constants.SECURITY_FILTER.REDIS_KEY_USER_BLACKLIST_PREFIX + username))) {
                log.warn("User {} is blacklisted (revoked) - denying access", username);
                return true;
            }

            return false;
        } catch (Exception e) {
            log.warn("Failed to check token blacklist", e);
            return false;
        }
    }

    private boolean checkPermission(HttpServletRequest request,
            String token,
            Map<String, Object> payload) {
        if (token == null) {
            return false;
        }

        try {
            RequestContext requestContext = getRequestContextSafe();
            enrichRequestContext(requestContext, request, payload);

            String sub = getStringClaim(payload, Constants.JWT_CLAIMS.USER_ID);
            if (StringUtils.isBlank(sub)) {
                log.warn("SUB claim not found in token payload - denying access");
                return false;
            }

            String requestURI = request.getServletPath();
            if (request.getPathInfo() != null) {
                requestURI += request.getPathInfo();
            }

            return checkUserPermission(sub, payload, requestURI, request.getMethod());
        } catch (AccessDeniedException e) {
            return false;
        } catch (Exception e) {
            log.error("Permission check failed for request {} {}",
                    request.getMethod(), request.getServletPath(), e);
            throw e;
        }
    }

    private RequestContext getRequestContextSafe() {
        try {
            return applicationContext.getBean(RequestContext.class);
        } catch (BeansException ex) {
            log.warn("RequestContext bean not available, fallback to no-context permission check");
            return new RequestContext();
        }
    }

    private void enrichRequestContext(RequestContext requestContext,
            HttpServletRequest request,
            Map<String, Object> payload) {
        requestContext.userAgent(RequestClientInfo.getUserAgent(request));
        requestContext.ipAddress(RequestClientInfo.getClientIpAddr(request));
        requestContext.urlRequest(RequestClientInfo.getUrlWithQueryString(request));
        requestContext.urlReferer(RequestClientInfo.getReferer(request));
        requestContext.menuCode(
                RequestClientInfo.getHttpMethodAndUrlWithoutQueryString(request));
        requestContext.menuAction(request.getMethod());

        if (payload == null) {
            return;
        }

        requestContext.iss(getStringClaim(payload, Constants.SECURITY_FILTER.JWT_ISS));
        requestContext.azp(getStringClaim(payload, Constants.SECURITY_FILTER.JWT_AZP));
        requestContext.exp(getInstantClaim(payload, Constants.SECURITY_FILTER.JWT_EXP));
        requestContext.iat(getInstantClaim(payload, Constants.SECURITY_FILTER.JWT_IAT));
        requestContext.sub(getStringClaim(payload, Constants.JWT_CLAIMS.USER_ID));
        requestContext.preferredUsername(
                getStringClaim(payload, Constants.JWT_CLAIMS.USER_NAME));
    }

    private String getStringClaim(Map<String, Object> payload, String key) {
        Object value = payload.get(key);
        return value != null ? String.valueOf(value) : null;
    }

    private Instant getInstantClaim(Map<String, Object> payload, String key) {
        Object value = payload.get(key);
        if (value == null) {
            return null;
        }
        try {
            return Instant.ofEpochSecond(Long.parseLong(String.valueOf(value)));
        } catch (NumberFormatException e) {
            log.warn("Failed to parse JWT claim '{}' as epoch second: {}", key, value);
            return null;
        }
    }


    private void writeError(HttpServletResponse response,
            String errorCode,
            HttpStatus status) throws IOException {
        String shortTraceId = TraceUtils.getShortTraceId();

        String fallbackKey = resolveFallbackKeyByErrorCode(errorCode);
        String errorMessage = messageResolver.getMessage(fallbackKey);

        Response.ResponseBuilder<Object> bodyBuilder = Response.builder()
                .statusCode(status.value())
                .message(errorMessage)
                .traceId(shortTraceId);

        if (status == HttpStatus.FORBIDDEN) {
            bodyBuilder.error(ErrorEnum.AUTHORIZATION_WARNING);
        } else if (status == HttpStatus.UNAUTHORIZED) {
            bodyBuilder.error(ErrorEnum.SECURITY);
        } else if (status.isError()) {
            bodyBuilder.error(ErrorEnum.TECHNICAL);
        }

        Response<Object> body = bodyBuilder.build();

        byte[] bytesValue = JsonUtils.writeValueAsBytes(body);

        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.toString());
        response.getOutputStream().write(bytesValue);
        response.flushBuffer();
    }

    private String resolveFallbackKeyByErrorCode(String errorCode) {
        if (Constants.SECURITY_FILTER.ERROR_CODE_UNAUTHORIZED.equals(errorCode)
                || Constants.SECURITY_FILTER.ERROR_CODE_TOKEN_REVOKED.equals(errorCode)) {
            return "handler.error.unauthorized";
        }
        if (Constants.SECURITY_FILTER.ERROR_CODE_ACCESS_DENIED.equals(errorCode)) {
            return "handler.error.access.denied";
        }
        if (Constants.SECURITY_FILTER.ERROR_CODE_API_NOT_FOUND.equals(errorCode)) {
            return "handler.error.not.found";
        }
        return "handler.error.generic";
    }

    private <A extends Annotation> A getHandlerAnnotation(HttpServletRequest request, @NonNull Class<A> annotationType) {
        try {
            RequestMappingHandlerMapping handlerMapping = resolveHandlerMapping();

            HandlerExecutionChain handlerChain = handlerMapping != null
                    ? handlerMapping.getHandler(
                            Objects.requireNonNull(request, "request must not be null"))
                    : null;

            if (handlerChain != null
                    && handlerChain.getHandler() instanceof HandlerMethod handlerMethod) {
                A methodAnnotation = handlerMethod.getMethodAnnotation(annotationType);
                if (methodAnnotation != null) {
                    return methodAnnotation;
                }

                return handlerMethod.getBeanType().getAnnotation(annotationType);
            }
        } catch (Exception ignored) {
        }

        return null;
    }

    private boolean isClientCredentialToken(Map<String, Object> payload) {
        if (payload == null) {
            return false;
        }
        String username = getStringClaim(payload, Constants.JWT_CLAIMS.USER_NAME);
        return StringUtils.isBlank(username)
                || username.startsWith(Constants.SECURITY_FILTER.SERVICE_ACCOUNT_USERNAME_PREFIX);
    }

    private List<String> getWhiteList() {
        try {
            List<String> consulWhiteList = authorizationProperties != null
                    ? authorizationProperties.getWhiteList()
                    : Collections.emptyList();
            if (consulWhiteList != null && !consulWhiteList.isEmpty()) {
                return consulWhiteList;
            }
        } catch (Exception e) {
            log.warn("Failed to get whitelist from Consul configuration", e);
        }

        log.warn("No whitelist configuration found - returning empty list."
                + " Please configure whitelist in Consul.");
        return Collections.emptyList();
    }

    private boolean checkUserPermission(String sub,
            Map<String, Object> payload,
            String requestURI,
            String method) {
        try {
            if (isWhitelistedUrl(requestURI)) {
                return true;
            }

            if (StringUtils.isEmpty(sub)) {
                return false;
            }

            String username = getStringClaim(payload, Constants.JWT_CLAIMS.USER_NAME);
            String cacheIdentifier = StringUtils.isNotBlank(username) ? username : sub;

            String permissionJson = cacheService.getString(UserCacheKeys.permissions(cacheIdentifier));
            if (StringUtils.isEmpty(permissionJson)) {
                permissionJson = loadPermissionsFromSource(sub, payload);
            }
            if (StringUtils.isEmpty(permissionJson)) {
                log.debug("No permissions resolved for sub: {}", sub);
                return false;
            }

            List<Map<String, String>> permissions = JsonUtils.convertJsonStringToList(
                    permissionJson, new tools.jackson.core.type.TypeReference<>() {
                    });

            if (permissions == null || permissions.isEmpty()) {
                log.debug("Empty permission set for sub: {}", sub);
                return false;
            }

            return checkPermissionFromCache(permissions, requestURI, method);

        } catch (Exception e) {
            log.error("Error during permission check for sub: {}", sub, e);
            return false;
        }
    }

    private String loadPermissionsFromSource(String sub, Map<String, Object> payload) {
        if (permissionProvider == null || payload == null) {
            return null;
        }
        String username = getStringClaim(payload, Constants.JWT_CLAIMS.USER_NAME);
        long ttlSeconds = remainingTokenTtlSeconds(payload);
        if (StringUtils.isBlank(username) || ttlSeconds <= 0) {
            return null;
        }
        return permissionProvider.loadAndCachePermissions(sub, username, ttlSeconds);
    }

    private long remainingTokenTtlSeconds(Map<String, Object> payload) {
        Instant exp = getInstantClaim(payload, Constants.SECURITY_FILTER.JWT_EXP);
        if (exp == null) {
            return 0;
        }
        return Math.max(exp.getEpochSecond() - Instant.now().getEpochSecond(), 0);
    }

    private boolean isWhitelistedUrl(String requestURI) {
        List<String> whiteList = getWhiteList();
        return matchesPattern(whiteList, requestURI)
                || matchesPattern(securityConfigWhitelist, requestURI);
    }

    private boolean matchesPattern(List<String> patterns, String requestURI) {
        if (patterns == null || patterns.isEmpty()) {
            return false;
        }
        return patterns.stream().anyMatch(pattern -> {
            if (StringUtils.isBlank(pattern)) {
                return false;
            }
            String normalizedPattern = pattern.trim();
            return ANT_PATH_MATCHER.match(
                    Objects.requireNonNull(normalizedPattern, "pattern must not be null"),
                    Objects.requireNonNull(requestURI, "requestURI must not be null"));
        });
    }

    private boolean shouldBypassAuthorization(HttpServletRequest request) {
        String uri = request.getRequestURI();

        if (Constants.SECURITY_FILTER.ACTUATOR_PATH.equals(uri)
                || uri.startsWith(Constants.SECURITY_FILTER.ACTUATOR_PATH_PREFIX)) {
            return true;
        }

        if (isWhitelistedUrl(uri)) {
            return true;
        }

        return getHandlerAnnotation(request, SkipPermissionCheck.class) != null;
    }

    private RequestMappingHandlerMapping resolveHandlerMapping() {
        if (handlerMappings == null || handlerMappings.isEmpty()) {
            return null;
        }

        RequestMappingHandlerMapping primary = handlerMappings.get(
                Constants.SECURITY_FILTER.SPRING_HANDLER_MAPPING_BEAN_NAME);
        if (primary != null) {
            return primary;
        }

        return handlerMappings.values().iterator().next();
    }

    private boolean apiExists(HttpServletRequest request) {
        try {
            RequestMappingHandlerMapping handlerMapping = resolveHandlerMapping();

            if (handlerMapping == null) {
                log.warn("HandlerMapping not found, cannot check if API exists for: {} {}",
                        request.getMethod(), request.getRequestURI());
                return true;
            }

            HandlerExecutionChain handlerChain = handlerMapping.getHandler(Objects.requireNonNull(request));

            if (handlerChain == null) {
                log.debug("API endpoint not found: {} {}",
                        request.getMethod(), request.getRequestURI());
                return false;
            }

            log.debug("API endpoint exists: {} {}",
                    request.getMethod(), request.getRequestURI());
            return true;

        } catch (Exception e) {
            log.warn("Error checking if API exists for {} {}",
                    request.getMethod(), request.getRequestURI(), e);
            return true;
        }
    }

    private boolean checkPermissionFromCache(List<Map<String, String>> permissions,
            String requestURI,
            String method) {
        try {
            if (permissions == null || permissions.isEmpty()) {
                return false;
            }

            for (Map<String, String> permission : permissions) {
                if (permission != null && matchesPermission(permission, requestURI, method)) {
                    return true;
                }
            }

            return false;

        } catch (Exception e) {
            return false;
        }
    }

    private boolean matchesPermission(Map<String, String> permission,
            String requestURI,
            String method) {
        try {
            String permMethod = permission.get(PERMISSION_FIELD_METHOD);
            String permUri = permission.get(PERMISSION_FIELD_URI);

            if (StringUtils.isEmpty(permMethod) || StringUtils.isEmpty(permUri)) {
                return false;
            }

            if (!permMethod.equalsIgnoreCase(method)) {
                return false;
            }

            String normalizedPermUri = permUri.trim();
            return ANT_PATH_MATCHER.match(
                    Objects.requireNonNull(normalizedPermUri, "permUri must not be null"),
                    Objects.requireNonNull(requestURI, "requestURI must not be null"));

        } catch (Exception e) {
            return false;
        }
    }

}
