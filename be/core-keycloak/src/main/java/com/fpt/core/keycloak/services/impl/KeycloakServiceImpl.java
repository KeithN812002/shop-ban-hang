package com.fpt.core.keycloak.services.impl;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import com.fpt.core.cache.service.CacheService;
import com.fpt.core.common.exception.BaseException;
import com.fpt.core.keycloak.config.KeycloakProperties;
import com.fpt.core.keycloak.services.KeycloakService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;
import java.util.Objects;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
public class KeycloakServiceImpl implements KeycloakService {

    private static final long ADMIN_TOKEN_SAFETY_MARGIN_MS = 10_000L;
    private static final String PASSWORD_POLICY_CACHE_KEY = "sa:auth:password-policy";
    private static final int PASSWORD_POLICY_CACHE_TTL_SECONDS = 3600;

    private final KeycloakProperties keycloakProperties;
    private final RestTemplate keycloakRestTemplate;
    private final CacheService cacheService;
    private final ObjectMapper objectMapper;

    private final Object adminTokenLock = new Object();
    private volatile String cachedAdminToken;
    private volatile long adminTokenExpiryEpochMs;

    public KeycloakServiceImpl(KeycloakProperties keycloakProperties,
                               @Qualifier("keycloakRestTemplate") RestTemplate keycloakRestTemplate,
                               CacheService cacheService, ObjectMapper objectMapper) {
        this.keycloakProperties = keycloakProperties;
        this.keycloakRestTemplate = keycloakRestTemplate;
        this.cacheService = cacheService;
        this.objectMapper = objectMapper;
    }

    private String clientId() {
        return keycloakProperties.getResource().getApp();
    }

    private String clientSecret() {
        return keycloakProperties.getCredentials().getSecret();
    }

    @Override
    public void login(String username, String password) {
        MultiValueMap<String, String> form = baseClientForm();
        form.add("grant_type", "password");
        form.add("username", username);
        form.add("password", password);
        ResponseEntity<Map<String, Object>> response = postForm(keycloakProperties.getTokenEndpoint(), form);
        Map<String, Object> body = response.getBody();
        Object refreshToken = body != null ? body.get("refresh_token") : null;
        if (refreshToken != null) {
            revokeSession(refreshToken.toString());
        }
    }

    private void revokeSession(String refreshToken) {
        MultiValueMap<String, String> form = baseClientForm();
        form.add("refresh_token", refreshToken);
        try {
            postForm(keycloakProperties.getLogoutEndpoint(), form);
        } catch (Exception e) {
            log.warn("Failed to revoke Keycloak session after password verification: {}", e.getMessage());
        }
    }

    @Override
    public ResponseEntity<Map<String, Object>> refreshToken(String refreshToken) {
        MultiValueMap<String, String> form = baseClientForm();
        form.add("grant_type", "refresh_token");
        form.add("refresh_token", refreshToken);
        return postForm(keycloakProperties.getTokenEndpoint(), form);
    }

    @Override
    public ResponseEntity<Map<String, Object>> exchangeAuthCode(String authCode, String redirectUri) {
        MultiValueMap<String, String> form = baseClientForm();
        form.add("grant_type", "authorization_code");
        form.add("code", authCode);
        form.add("redirect_uri", redirectUri);
        return postForm(keycloakProperties.getTokenEndpoint(), form);
    }

    @Override
    public ResponseEntity<Map<String, Object>> clientCredentialsToken() {
        MultiValueMap<String, String> form = baseClientForm();
        form.add("grant_type", "client_credentials");
        return postForm(keycloakProperties.getTokenEndpoint(), form);
    }

    private String getAdminAccessToken() {
        String token = cachedAdminToken;
        if (token != null && System.currentTimeMillis() < adminTokenExpiryEpochMs) {
            return token;
        }
        synchronized (adminTokenLock) {
            if (cachedAdminToken != null && System.currentTimeMillis() < adminTokenExpiryEpochMs) {
                return cachedAdminToken;
            }
            return fetchAndCacheAdminToken();
        }
    }

    private String fetchAndCacheAdminToken() {
        MultiValueMap<String, String> form = baseClientForm();
        form.add("grant_type", "client_credentials");
        if (StringUtils.hasText(keycloakProperties.getAdminTokenScope())) {
            form.add("scope", keycloakProperties.getAdminTokenScope());
        }
        try {
            Map<String, Object> body = postForm(keycloakProperties.getTokenEndpoint(), form).getBody();
            if (body == null || body.get("access_token") == null) {
                throw new BaseException("errors.keycloak.admin-token.empty", "No access_token in Keycloak response");
            }
            String token = (String) body.get("access_token");
            long expiresInSec = body.get("expires_in") instanceof Number n ? n.longValue() : 60L;
            cachedAdminToken = token;
            adminTokenExpiryEpochMs = System.currentTimeMillis()
                    + Math.max(0L, expiresInSec * 1000L - ADMIN_TOKEN_SAFETY_MARGIN_MS);
            return token;
        } catch (BaseException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to get admin access token from Keycloak", e);
            throw new BaseException("errors.keycloak.admin-token.failed", e.getMessage());
        }
    }

    @Override
    public String createUser(String username, String password, String email, String firstName, String lastName,
                             boolean enabled, String isInternal) {
        try {
            String adminToken = getAdminAccessToken();
            if (userExists(username)) {
                throw new BaseException("errors.keycloak.user.exists", "User already exists: " + username);
            }
            String userId = createUserInKeycloak(adminToken, username, email, firstName, lastName, enabled, isInternal);
            if (password != null && !password.trim().isEmpty()) {
                resetUserPassword(adminToken, userId, password, true);
            }
            return userId;
        } catch (BaseException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to create user in Keycloak: {}", username, e);
            throw new BaseException("errors.keycloak.user.create.failed", e.getMessage());
        }
    }

    @Override
    public void updateUser(String username, String email, String firstName, String lastName,
                           boolean enabled, String isInternal) {
        try {
            String adminToken = getAdminAccessToken();
            if (!userExists(username)) {
                throw new BaseException("errors.keycloak.user.not-found", "User does not exist: " + username);
            }
            updateUserProfile(adminToken, findUserIdByUsername(adminToken, username),
                    email, firstName, lastName, enabled, isInternal);
        } catch (BaseException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to update user in Keycloak: {}", username, e);
            throw new BaseException("errors.keycloak.user.update.failed", e.getMessage());
        }
    }

    @Override
    public void deleteUser(String username) {
        try {
            String adminToken = getAdminAccessToken();
            String userId = findUserIdByUsername(adminToken, username);
            adminVoidCall(keycloakProperties.getAdminUserEndpoint(userId), HttpMethod.DELETE, null, adminToken,
                    "errors.keycloak.user.delete.failed");
        } catch (BaseException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to delete user in Keycloak: {}", username, e);
            throw new BaseException("errors.keycloak.user.delete.failed", e.getMessage());
        }
    }

    @Override
    public boolean userExists(String username) {
        try {
            return findUserByUsername(getAdminAccessToken(), username) != null;
        } catch (Exception e) {
            log.warn("userExists check failed for {}, assuming not found", username, e);
            return false;
        }
    }

    @Override
    public void setUserEnabled(String username, boolean enabled) {
        try {
            String adminToken = getAdminAccessToken();
            String userId = findUserIdByUsername(adminToken, username);
            adminVoidCall(keycloakProperties.getAdminUserEndpoint(userId), HttpMethod.PUT, Map.of("enabled", enabled),
                    adminToken, "errors.keycloak.user.enable.failed");
        } catch (BaseException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to set enabled status in Keycloak for user: {}", username, e);
            throw new BaseException("errors.keycloak.user.enable.failed", e.getMessage());
        }
    }

    @Override
    public void changeUserPassword(String username, String newPassword, boolean temporary) {
        try {
            String adminToken = getAdminAccessToken();
            resetUserPassword(adminToken, findUserIdByUsername(adminToken, username), newPassword, temporary);
        } catch (BaseException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to change password in Keycloak for user: {}", username, e);
            throw new BaseException("errors.keycloak.password.change.failed", e.getMessage());
        }
    }

    private String findUserIdByUsername(String adminToken, String username) {
        Map<String, Object> user = findUserByUsername(adminToken, username);
        if (user == null) {
            throw new BaseException("errors.keycloak.user.not-found", "User not found: " + username);
        }
        return (String) user.get("id");
    }

    private Map<String, Object> findUserByUsername(String adminToken, String username) {
        String url = UriComponentsBuilder.fromUriString(Objects.requireNonNull(keycloakProperties.getAdminUsersEndpoint()))
                .queryParam("username", username)
                .queryParam("exact", true)
                .build()
                .toUriString();

        List<Map<String, Object>> users = keycloakRestTemplate.exchange(Objects.requireNonNull(url), Objects.requireNonNull(HttpMethod.GET),
                new HttpEntity<>(null, bearerJsonHeaders(adminToken)),
                new ParameterizedTypeReference<List<Map<String, Object>>>() {}).getBody();

        return (users != null && !users.isEmpty()) ? users.getFirst() : null;
    }

    private String createUserInKeycloak(String adminToken, String username, String email, String firstName,
                                        String lastName, boolean enabled, String isInternal) {
        Map<String, Object> userData = new HashMap<>();
        userData.put("username", username);
        userData.put("enabled", enabled);
        userData.put("emailVerified", false);
        userData.put("attributes", Map.of("isInternal", List.of(isInternal)));
        putIfNotBlank(userData, "email", email);
        putIfNotBlank(userData, "firstName", firstName);
        putIfNotBlank(userData, "lastName", lastName);

        ResponseEntity<Void> response = keycloakRestTemplate.exchange(Objects.requireNonNull(keycloakProperties.getAdminUsersEndpoint()),
                Objects.requireNonNull(HttpMethod.POST), new HttpEntity<>(userData, bearerJsonHeaders(adminToken)), Void.class);

        if (response.getStatusCode().value() != 201) {
            throw new BaseException("errors.keycloak.user.create.failed",
                    "Unexpected status creating user: " + response.getStatusCode());
        }

        String location = response.getHeaders().getFirst(HttpHeaders.LOCATION);
        return location != null
                ? location.substring(location.lastIndexOf('/') + 1)
                : findUserIdByUsername(adminToken, username);
    }

    private void resetUserPassword(String adminToken, String userId, String newPassword, boolean temporary) {
        Map<String, Object> payload = Map.of("type", "password", "value", newPassword, "temporary", temporary);
        adminVoidCall(keycloakProperties.getAdminUserEndpoint(userId) + "/reset-password", HttpMethod.PUT, payload,
                adminToken, "errors.keycloak.password.reset.failed");
    }

    private void updateUserProfile(String adminToken, String userId, String email, String firstName,
                                   String lastName, boolean enabled, String isInternal) {
        Map<String, Object> userData = new HashMap<>();
        userData.put("enabled", enabled);
        userData.put("attributes", Map.of("isInternal", List.of(isInternal)));
        if (email != null && !email.trim().isEmpty()) {
            userData.put("email", email);
            userData.put("emailVerified", false);
        }
        putIfNotBlank(userData, "firstName", firstName);
        putIfNotBlank(userData, "lastName", lastName);

        adminVoidCall(keycloakProperties.getAdminUserEndpoint(userId), HttpMethod.PUT, userData, adminToken,
                "errors.keycloak.user.update.failed");
    }

    @Override
    public Map<String, Object> getPasswordPolicy() {
        String cached = cacheService.getString(PASSWORD_POLICY_CACHE_KEY);
        if (cached != null) {
            try {
                return objectMapper.readValue(cached, new TypeReference<>() {
                });
            } catch (Exception e) {
                log.warn("Failed to read cached password policy, re-fetching from Keycloak", e);
            }
        }
        Map<String, Object> policy = fetchPasswordPolicyFromKeycloak();
        try {
            cacheService.setString(PASSWORD_POLICY_CACHE_KEY, objectMapper.writeValueAsString(policy),
                    PASSWORD_POLICY_CACHE_TTL_SECONDS);
        } catch (Exception e) {
            log.warn("Failed to cache password policy", e);
        }
        return policy;
    }

    private Map<String, Object> fetchPasswordPolicyFromKeycloak() {
        try {
            Map<String, Object> realmData = keycloakRestTemplate.exchange(Objects.requireNonNull(keycloakProperties.getAdminRealmEndpoint()),
                    Objects.requireNonNull(HttpMethod.GET), new HttpEntity<>(null, bearerJsonHeaders(getAdminAccessToken())),
                    new ParameterizedTypeReference<Map<String, Object>>() {}).getBody();
            if (realmData == null) {
                throw new BaseException("errors.keycloak.realm.empty", "No realm data from Keycloak");
            }
            return parsePasswordPolicy((String) realmData.get("passwordPolicy"));
        } catch (BaseException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to get password policy from Keycloak", e);
            throw new BaseException("errors.keycloak.password-policy.failed", e.getMessage());
        }
    }

    @Override
    public void updatePasswordPolicy(String passwordPolicy) {
        Map<String, Object> body = new HashMap<>();
        body.put("realm", keycloakProperties.getRealm());
        body.put("passwordPolicy", passwordPolicy == null ? "" : passwordPolicy);
        adminVoidCall(keycloakProperties.getAdminRealmEndpoint(), HttpMethod.PUT, body, getAdminAccessToken(),
                "errors.keycloak.password-policy.update.failed");
        cacheService.delete(PASSWORD_POLICY_CACHE_KEY);
    }

    @Override
    public Map<String, Object> validatePassword(String password) {
        return validatePasswordAgainstPolicy(password, getPasswordPolicy());
    }

    private Map<String, Object> parsePasswordPolicy(String policyString) {
        Map<String, Object> policy = new HashMap<>();
        boolean blank = policyString == null || policyString.isEmpty();
        policy.put("minLength", blank ? null : extractNumber(policyString, "length"));
        policy.put("minDigits", blank ? null : extractNumber(policyString, "digits"));
        policy.put("minLowerCase", blank ? null : extractNumber(policyString, "lowerCase"));
        policy.put("minUpperCase", blank ? null : extractNumber(policyString, "upperCase"));
        policy.put("minSpecialChars", blank ? null : extractNumber(policyString, "specialChars"));
        policy.put("passwordHistory", blank ? null : extractNumber(policyString, "passwordHistory"));
        policy.put("notUsername", policyString != null && policyString.contains("notUsername"));
        policy.put("regexPattern", blank ? null : extractRegex(policyString));
        policy.put("rawPolicy", blank ? "" : policyString);
        return policy;
    }

    private Integer extractNumber(String policy, String key) {
        Matcher matcher = Pattern.compile(key + "\\((\\d+)\\)").matcher(policy);
        return matcher.find() ? Integer.parseInt(matcher.group(1)) : null;
    }

    private String extractRegex(String policy) {
        Matcher matcher = Pattern.compile("regexPattern\\((.+?)\\)").matcher(policy);
        return matcher.find() ? matcher.group(1) : null;
    }

    private Map<String, Object> validatePasswordAgainstPolicy(String password, Map<String, Object> policy) {
        List<String> errors = new ArrayList<>();
        Map<String, Boolean> rules = new HashMap<>();

        if (password == null) {
            errors.add("Password must not be null");
            rules.put("noSpace", false);
            return buildValidationResult(errors, rules);
        }

        checkRule(rules, errors, "minLength", (Integer) policy.get("minLength"), password.length(),
                "Password must be at least %d characters");
        checkRule(rules, errors, "minDigits", (Integer) policy.get("minDigits"),
                password.replaceAll("\\D", "").length(), "Password must contain at least %d digits");
        checkRule(rules, errors, "minLowerCase", (Integer) policy.get("minLowerCase"),
                password.replaceAll("[^a-z]", "").length(), "Password must contain at least %d lowercase characters");
        checkRule(rules, errors, "minUpperCase", (Integer) policy.get("minUpperCase"),
                password.replaceAll("[^A-Z]", "").length(), "Password must contain at least %d uppercase characters");
        checkRule(rules, errors, "minSpecialChars", (Integer) policy.get("minSpecialChars"),
                password.replaceAll("[A-Za-z0-9]", "").length(),
                "Password must contain at least %d special characters");

        boolean noSpace = !password.contains(" ");
        rules.put("noSpace", noSpace);
        if (!noSpace) {
            errors.add("Password must not contain spaces");
        }

        return buildValidationResult(errors, rules);
    }

    private void checkRule(Map<String, Boolean> rules, List<String> errors, String key, Integer min, int actual,
                           String errorTemplate) {
        if (min == null || min <= 0) {
            return;
        }
        boolean ok = actual >= min;
        rules.put(key, ok);
        if (!ok) {
            errors.add(String.format(errorTemplate, min));
        }
    }

    private Map<String, Object> buildValidationResult(List<String> errors, Map<String, Boolean> rules) {
        Map<String, Object> result = new HashMap<>();
        result.put("valid", errors.isEmpty());
        result.put("errors", errors);
        result.put("rules", rules);
        return result;
    }

    private MultiValueMap<String, String> baseClientForm() {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", clientId());
        form.add("client_secret", clientSecret());
        return form;
    }

    private ResponseEntity<Map<String, Object>> postForm(String url, MultiValueMap<String, String> form) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(Objects.requireNonNull(MediaType.APPLICATION_FORM_URLENCODED));
        return keycloakRestTemplate.exchange(Objects.requireNonNull(url), Objects.requireNonNull(HttpMethod.POST), new HttpEntity<>(form, headers),
                new ParameterizedTypeReference<>() {});
    }

    private void adminVoidCall(String url, HttpMethod method, Object body, String adminToken, String errorCode) {
        HttpEntity<Object> request = new HttpEntity<>(body, bearerJsonHeaders(adminToken));
        ResponseEntity<Void> response = keycloakRestTemplate.exchange(Objects.requireNonNull(url), Objects.requireNonNull(method), request, Void.class);
        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new BaseException(errorCode, method + " " + url + " -> HTTP " + response.getStatusCode());
        }
    }

    private HttpHeaders bearerJsonHeaders(String adminToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(Objects.requireNonNull(adminToken));
        headers.setContentType(Objects.requireNonNull(MediaType.APPLICATION_JSON));
        return headers;
    }

    private void putIfNotBlank(Map<String, Object> map, String key, String value) {
        if (value != null && !value.trim().isEmpty()) {
            map.put(key, value);
        }
    }
}
