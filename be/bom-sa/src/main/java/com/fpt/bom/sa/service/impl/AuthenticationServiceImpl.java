package com.fpt.bom.sa.service.impl;

import com.fpt.bom.sa.dto.authentication.ConfirmChangePasswordRequest;
import com.fpt.bom.sa.dto.authentication.RequestOtpRequest;
import com.fpt.bom.sa.dto.authentication.RequestOtpResponse;
import com.fpt.bom.sa.dto.authentication.ExchangeAuthCodeRequest;
import com.fpt.bom.sa.dto.authentication.ExchangeAuthCodeResponse;
import com.fpt.bom.sa.dto.authentication.MeResponse;
import com.fpt.bom.sa.dto.authentication.RefreshTokenRequest;
import com.fpt.bom.sa.dto.authentication.PermissionBeView;
import com.fpt.bom.sa.dto.authentication.PermissionFeView;
import com.fpt.bom.sa.dto.authentication.PermissionCache;
import com.fpt.bom.sa.entity.Permission;
import com.fpt.bom.sa.entity.Role;
import com.fpt.bom.sa.entity.RolePermission;
import com.fpt.bom.sa.entity.User;
import com.fpt.bom.sa.repository.PermissionRepository;
import com.fpt.bom.sa.repository.RolePermissionRepository;
import com.fpt.bom.sa.repository.RoleRepository;
import com.fpt.bom.sa.repository.UserRepository;
import com.fpt.bom.sa.service.AuthenticationService;
import com.fpt.core.keycloak.services.KeycloakService;
import com.fpt.core.cache.service.CacheService;
import com.fpt.core.common.constant.Constants;
import com.fpt.core.common.constant.UserCacheKeys;
import com.fpt.core.common.properties.AppSsoProperties;
import com.fpt.bom.sa.constant.EmailEvents;
import com.fpt.core.email.dto.emailOutbox.EmailOutboxQueueTransfer;
import com.fpt.core.email.service.EmailOutboxService;
import com.fpt.core.security.util.AesCryptoUtils;
import com.fpt.core.common.enums.StatusBasic;
import com.fpt.core.common.enums.PermissionEnum;
import com.fpt.core.common.exception.BaseException;
import com.fpt.core.security.permission.UserPermissionProvider;
import com.fpt.core.security.util.SecurityUtils;
import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpClientErrorException;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.*;
import java.util.function.Consumer;
import java.util.function.Supplier;
import java.util.stream.Collectors;

/**
 * Author: hoanglm21@fpt.com
 * Date: 1/1/26
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AuthenticationServiceImpl implements AuthenticationService, UserPermissionProvider {

    private static final Set<PermissionEnum> FE_PERMISSION_TYPES = EnumSet.of(
            PermissionEnum.ROOT, PermissionEnum.GROUP, PermissionEnum.MENU, PermissionEnum.PAGE,
            PermissionEnum.FUNCTION);

    private static final SecureRandom secureRandom = new SecureRandom();

    private final KeycloakService keycloakService;
    private final CacheService cacheService;
    private final ModelMapper modelMapper;
    private final ObjectMapper objectMapper;
    private final PermissionRepository permissionRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final EmailOutboxService emailOutboxService;
    private final AppSsoProperties appSsoProperties;
    private final AesCryptoUtils aesCryptoUtils;

    @Override
    public ExchangeAuthCodeResponse exchangeAuthCode(ExchangeAuthCodeRequest request) {
        String cacheKey = Constants.AUTH.REDIS_KEY_AUTH_CODE_PREFIX + request.getAuthCode();

        ExchangeAuthCodeResponse cached = readCachedExchange(cacheKey);
        if (cached != null) {
            return cached;
        }

        return requestTokens("Exchange auth code", "auth.code.exchange.failed",
                () -> keycloakService.exchangeAuthCode(request.getAuthCode(), request.getRedirectUri()),
                result -> cacheExchange(cacheKey, result));
    }

    @Override
    public ExchangeAuthCodeResponse refreshToken(RefreshTokenRequest request) {
        return requestTokens("Refresh token", "auth.token.refresh.failed",
                () -> keycloakService.refreshToken(request.getRefreshToken()),
                result -> { });
    }

    @Override
    @Transactional(readOnly = true)
    public MeResponse me() {
        Jwt jwt = getCurrentJwt();
        String sub = jwt.getSubject();

        String username = requireCurrentUsername();
        User user = requireActiveUser(username);

        PermissionCache permissionCache = loadUserPermissionsFromDb(user);

        return buildMeResponse(user, sub, jwt, permissionCache);
    }

    @Override
    public RequestOtpResponse requestOtp(RequestOtpRequest request) {
        String username = requireCurrentUsername();
        User user = requireChangePasswordUser(username, true);

        // 1. Check Cooldown
        requireNoOtpCooldown(username);

        // 2. Validate old password using Keycloak first
        try {
            keycloakService.login(username, request.getOldPassword());
        } catch (Exception e) {
            log.warn("Request change password OTP rejected: invalid old password for user {}", username);
            throw new BaseException("auth.changePassword.old.invalid");
        }

        // 3. Reject a new password that is the same as the old one
        if (request.getNewPassword().trim().equals(request.getOldPassword().trim())) {
            throw new BaseException("auth.changePassword.newSameAsOld");
        }

        // 4. Validate new password logic in Keycloak
        Map<String, Object> validation = keycloakService.validatePassword(request.getNewPassword());
        if (!Boolean.TRUE.equals(validation.get("valid"))) {
            Object errors = validation.get("errors");
            String detail = errors instanceof List<?> list
                    ? list.stream().map(String::valueOf).collect(Collectors.joining("; "))
                    : "";
            throw new BaseException("auth.changePassword.new.invalid", detail);
        }

        Map<String, String> cacheData = new HashMap<>();
        cacheData.put("newPassword", aesCryptoUtils.encrypt(request.getNewPassword().trim()));
        return issueChangePasswordOtp(user, username, cacheData, "Requested");
    }

    @Override
    public RequestOtpResponse resendOtp() {
        String username = requireCurrentUsername();
        User user = requireChangePasswordUser(username, true);

        requireNoOtpCooldown(username);

        Map<String, String> cacheData = readOtpCache(username);

        String encryptedNewPassword = cacheData.get("newPassword");
        if (!StringUtils.hasText(encryptedNewPassword)) {
            throw new BaseException("auth.changePassword.otp.invalid");
        }

        cacheService.delete("OTP_CHANGE_PASSWORD_LOCKED:" + username);
        return issueChangePasswordOtp(user, username, cacheData, "Resent");
    }

    @Override
    public void confirmChangePassword(ConfirmChangePasswordRequest request) {
        String username = requireCurrentUsername();
        requireChangePasswordUser(username, false);

        String errorKey = "OTP_CHANGE_PASSWORD_ERRORS:" + username;
        String errorsVal = cacheService.getString(errorKey);
        int failedAttempts = 0;
        if (StringUtils.hasText(errorsVal)) {
            try {
                failedAttempts = Integer.parseInt(errorsVal);
            } catch (NumberFormatException ignored) {
            }
        }

        if (failedAttempts >= 5) {
            throw new BaseException("auth.changePassword.otp.tooManyFailedAttempts");
        }

        Map<String, String> cacheData = readOtpCache(username);

        String cachedOtp = cacheData.get("otp");
        String encryptedNewPassword = cacheData.get("newPassword");

        boolean isOtpValid = StringUtils.hasText(cachedOtp)
                && StringUtils.hasText(request.getOtp())
                && MessageDigest.isEqual(cachedOtp.getBytes(), request.getOtp().getBytes());

        if (!isOtpValid) {
            failedAttempts++;
            int changePasswordOtpExpireMinutes = appSsoProperties.getOtp() != null
                    && appSsoProperties.getOtp().getChangePasswordExpireMinutes() != null
                            ? appSsoProperties.getOtp().getChangePasswordExpireMinutes()
                            : 5;
            cacheService.setString(errorKey, String.valueOf(failedAttempts), changePasswordOtpExpireMinutes * 60);

            if (failedAttempts >= 5) {
                throw new BaseException("auth.changePassword.otp.tooManyFailedAttempts");
            }
            throw new BaseException("auth.changePassword.otp.invalid");
        }

        String decryptedNewPassword = aesCryptoUtils.decrypt(encryptedNewPassword);
        if (!StringUtils.hasText(decryptedNewPassword)) {
            throw new BaseException("auth.changePassword.new.invalid");
        }

        keycloakService.changeUserPassword(username, decryptedNewPassword, false);
        cacheService.delete("OTP_CHANGE_PASSWORD:" + username);
        cacheService.delete(errorKey);
    }

    @Override
    public Map<String, Object> getPasswordPolicy() {
        return keycloakService.getPasswordPolicy();
    }

    @Override
    public void logout() {
        cleanupSessionCaches();
    }

    private String requireCurrentUsername() {
        String username = SecurityUtils.getCurrentUsername();
        if (!StringUtils.hasText(username)) {
            throw new BaseException("auth.user.current.not.found");
        }
        return username;
    }

    private User requireActiveUser(String username) {
        User user = userRepository.findByUserNameAndIsDeletedFalse(username)
                .orElseThrow(() -> new BaseException("auth.user.not.found"));
        if (!StatusBasic.ACTIVE.equals(user.getStatus())) {
            throw new BaseException("auth.user.inactive");
        }
        return user;
    }

    private User requireChangePasswordUser(String username, boolean requireEmail) {
        User user = requireActiveUser(username);
        if (Boolean.TRUE.equals(user.getIsInternal())) {
            throw new BaseException("auth.changePassword.internal.forbidden");
        }
        if (requireEmail && !StringUtils.hasText(user.getEmail())) {
            throw new BaseException("auth.changePassword.email.notFound");
        }
        return user;
    }

    private Map<String, String> readOtpCache(String username) {
        String cachedJson = cacheService.getString("OTP_CHANGE_PASSWORD:" + username);
        if (!StringUtils.hasText(cachedJson)) {
            throw new BaseException("auth.changePassword.otp.invalid");
        }
        try {
            return objectMapper.readValue(cachedJson, new TypeReference<>() {
            });
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse OTP cache", e);
        }
    }

    private void requireNoOtpCooldown(String username) {
        if (StringUtils.hasText(cacheService.getString("OTP_CHANGE_PASSWORD_COOLDOWN:" + username))) {
            throw new BaseException("auth.changePassword.otp.cooldown");
        }
    }

    private int changePasswordOtpExpireMinutes() {
        return appSsoProperties.getOtp() != null
                && appSsoProperties.getOtp().getChangePasswordExpireMinutes() != null
                        ? appSsoProperties.getOtp().getChangePasswordExpireMinutes()
                        : 5;
    }

    private int changePasswordCooldownMinutes() {
        return appSsoProperties.getOtp() != null
                && appSsoProperties.getOtp().getChangePasswordCooldownMinutes() != null
                        ? appSsoProperties.getOtp().getChangePasswordCooldownMinutes()
                        : 1;
    }

    private RequestOtpResponse issueChangePasswordOtp(User user, String username, Map<String, String> cacheData,
                                                      String action) {
        String otp = String.format("%06d", secureRandom.nextInt(1000000));
        int expireMinutes = changePasswordOtpExpireMinutes();
        int cooldownMinutes = changePasswordCooldownMinutes();

        cacheData.put("otp", otp);
        String jsonCache;
        try {
            jsonCache = objectMapper.writeValueAsString(cacheData);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize OTP cache", e);
        }

        cacheService.delete("OTP_CHANGE_PASSWORD_ERRORS:" + username);
        cacheService.setString("OTP_CHANGE_PASSWORD:" + username, jsonCache, expireMinutes * 60);
        cacheService.setString("OTP_CHANGE_PASSWORD_COOLDOWN:" + username, "1", cooldownMinutes * 60);

        Map<String, String> variables = new LinkedHashMap<>();
        variables.put("{appName}", appSsoProperties.getAppName());
        variables.put("{fullName}", user.getPersonalName() != null ? user.getPersonalName() : "");
        variables.put("{otp}", aesCryptoUtils.encrypt(otp));
        variables.put("{expireMinutes}", String.valueOf(expireMinutes));

        emailOutboxService.queueEmail(EmailOutboxQueueTransfer.builder()
                .eventType(EmailEvents.OTP_CHANGE_PASSWORD)
                .receiver(user.getEmail())
                .variablesMap(variables)
                .build());

        log.info("{} change password OTP for user={}. OTP={}", action, username, otp);
        return new RequestOtpResponse(cooldownMinutes, expireMinutes);
    }

    private ExchangeAuthCodeResponse requestTokens(String action, String errorKey,
                                                   Supplier<ResponseEntity<Map<String, Object>>> tokenCall,
                                                   Consumer<ExchangeAuthCodeResponse> onIssued) {
        try {
            ResponseEntity<Map<String, Object>> response = tokenCall.get();

            if (isInvalidTokenResponse(response)) {
                throw new BaseException(errorKey);
            }

            ExchangeAuthCodeResponse result = buildExchangeAuthCodeResponse(Objects.requireNonNull(response.getBody()));
            onIssued.accept(result);
            cacheUserContextFromTokens(result);
            return result;
        } catch (BaseException e) {
            throw e;
        } catch (HttpClientErrorException e) {
            log.warn("{} rejected by Keycloak, status={}, error={}", action, e.getStatusCode(), e.getMessage());
            throw new BaseException(errorKey);
        } catch (Exception e) {
            log.error("{} failed, error={}", action, e.getMessage(), e);
            throw new BaseException(errorKey);
        }
    }

    private boolean isInvalidTokenResponse(ResponseEntity<Map<String, Object>> response) {
        return response == null || !response.getStatusCode().is2xxSuccessful() || response.getBody() == null;
    }

    private ExchangeAuthCodeResponse buildExchangeAuthCodeResponse(Map<String, Object> token) {
        ExchangeAuthCodeResponse response = new ExchangeAuthCodeResponse();
        response.setIdToken(asString(token.get("id_token")));
        response.setAccessToken(asString(token.get("access_token")));
        response.setRefreshToken(asString(token.get("refresh_token")));
        response.setExpiresIn(asInteger(token.get("expires_in")));
        response.setRefreshExpiresIn(asInteger(token.get("refresh_expires_in")));
        response.setTokenType(asString(token.get("token_type")));
        response.setScope(asString(token.get("scope")));
        return response;
    }

    private ExchangeAuthCodeResponse readCachedExchange(String cacheKey) {
        try {
            String cached = cacheService.getString(cacheKey);
            if (StringUtils.hasText(cached)) {
                return objectMapper.readValue(cached, ExchangeAuthCodeResponse.class);
            }
        } catch (Exception e) {
            log.warn("Failed to read cached auth-code exchange, falling back to Keycloak: {}", e.getMessage());
        }
        return null;
    }

    private void cacheExchange(String cacheKey, ExchangeAuthCodeResponse result) {
        try {
            cacheService.setString(cacheKey, objectMapper.writeValueAsString(result),
                    Constants.AUTH.AUTH_CODE_CACHE_TTL_SECONDS);
        } catch (Exception e) {
            log.warn("Failed to cache auth-code exchange result: {}", e.getMessage());
        }
    }

    private String asString(Object value) {
        return value != null ? value.toString() : null;
    }

    private Integer asInteger(Object value) {
        return value instanceof Number number ? number.intValue() : null;
    }

    private void cleanupSessionCaches() {
        try {
            Jwt jwt = getCurrentJwt();
            String username = SecurityUtils.getCurrentUsername();

            String jti = jwt.getClaimAsString(Constants.SECURITY_FILTER.JWT_JTI);
            if (StringUtils.hasText(jti)) {
                var expiresAtInstant = jwt.getExpiresAt();
                long now = System.currentTimeMillis() / 1000;
                Long expiresAt = expiresAtInstant != null ? expiresAtInstant.getEpochSecond() : null;
                Integer ttlSeconds = (expiresAt != null && expiresAt > now) ? (int) (expiresAt - now) : null;

                if (ttlSeconds != null && ttlSeconds > 0) {
                    cacheService.setString(
                            Constants.SECURITY_FILTER.REDIS_KEY_TOKEN_BLACKLIST_PREFIX + jti, "1", ttlSeconds);
                }
            }

            cacheService.delete(UserCacheKeys.permissions(username));
            cacheService.delete(UserCacheKeys.unitId(username));
            cacheService.delete(UserCacheKeys.externalUnitCode(username));
            log.info("Cleanup session caches finished for username={}", username);
        } catch (Exception e) {
            log.warn("Clear cache on logout failed, error={}", e.getMessage());
        }
    }

    private PermissionCache loadUserPermissionsFromDb(User user) {
        if (user == null) {
            return PermissionCache.builder().fe(List.of()).be(List.of()).build();
        }

        List<String> roleCodes = user.getRoles();
        if (roleCodes == null || roleCodes.isEmpty()) {
            return PermissionCache.builder().fe(List.of()).be(List.of()).build();
        }

        List<Role> roles = roleRepository.findByCodeInAndStatus(roleCodes, StatusBasic.ACTIVE);
        List<UUID> roleIds = roles.stream().map(Role::getId).toList();

        if (roleIds.isEmpty()) {
            return PermissionCache.builder().fe(List.of()).be(List.of()).build();
        }

        List<RolePermission> rolePermissions = rolePermissionRepository.findByRoleIdIn(roleIds);
        Set<UUID> permissionIds = rolePermissions.stream()
                .map(RolePermission::getPermissionId)
                .collect(Collectors.toSet());

        List<Permission> permissions = permissionRepository.findByIdIn(permissionIds);

        List<Permission> activePermissions = permissions.stream()
                .filter(p -> StatusBasic.ACTIVE.equals(p.getStatus()))
                .toList();

        List<String> modules = activePermissions.stream()
                .filter(p -> PermissionEnum.ROOT.equals(p.getType()))
                .collect(Collectors.toMap(Permission::getModuleCode, p -> p, (a, b) -> a))
                .values().stream()
                .sorted(Comparator.comparingInt(p -> p.getSortOrder() != null ? p.getSortOrder() : Integer.MAX_VALUE))
                .map(Permission::getModuleCode)
                .toList();

        return PermissionCache.builder()
                .modules(modules)
                .fe(activePermissions.stream()
                        .filter(p -> FE_PERMISSION_TYPES.contains(p.getType()))
                        .map(this::toFePermissionView)
                        .toList())
                .be(activePermissions.stream()
                        .filter(p -> p.getMethod() != null && StringUtils.hasText(p.getUri()))
                        .map(this::toBePermissionView)
                        .toList())
                .build();
    }

    private void cacheUserContextFromTokens(ExchangeAuthCodeResponse tokens) {
        try {
            Map<String, Object> claims = decodeJwtClaims(tokens.getAccessToken());
            String sub = asString(claims.get(Constants.JWT_CLAIMS.USER_ID));
            String username = asString(claims.get(Constants.JWT_CLAIMS.USER_NAME));
            Integer ttlSeconds = tokens.getRefreshExpiresIn();
            if (!StringUtils.hasText(sub) || !StringUtils.hasText(username) || ttlSeconds == null || ttlSeconds <= 0) {
                return;
            }
            userRepository.findByUserNameAndIsDeletedFalse(username)
                    .ifPresent(user -> cacheUserContext(username, user, loadUserPermissionsFromDb(user), ttlSeconds));
        } catch (Exception e) {
            log.warn("Failed to pre-cache user context from token: {}", e.getMessage());
        }
    }

    private Map<String, Object> decodeJwtClaims(String jwt) {
        String[] parts = jwt != null ? jwt.split("\\.") : new String[0];
        if (parts.length < 2) {
            return Map.of();
        }
        byte[] payload = Base64.getUrlDecoder().decode(parts[1]);
        return objectMapper.readValue(payload, new TypeReference<>() {
        });
    }

    private String cacheUserContext(String username, User user, PermissionCache payload, int ttlSeconds) {
        try {
            // Internal and external users carry different unit identifiers; keep them in
            // separate keys so readers know the user type from which key is present and
            // never have to cast a non-UUID code through UUID.fromString.
            if (user.getUnitId() != null) {
                cacheService.setString(UserCacheKeys.unitId(username), user.getUnitId().toString(), ttlSeconds);
            } else if (user.getExternalUnitCode() != null) {
                cacheService.setString(UserCacheKeys.externalUnitCode(username), user.getExternalUnitCode(),
                        ttlSeconds);
            }
            List<PermissionBeView> bePermissions = payload.getBe() != null ? payload.getBe() : List.of();
            String permissionsJson = objectMapper.writeValueAsString(bePermissions);
            cacheService.setString(UserCacheKeys.permissions(username), permissionsJson, ttlSeconds);
            log.debug("Cached user context for username={}, ttl={}s", username, ttlSeconds);
            return permissionsJson;
        } catch (JacksonException e) {
            log.error("Failed to serialize permissions cache for username {}, error={}", username, e.getMessage(), e);
            return null;
        }
    }


    @Override
    public String loadAndCachePermissions(String sub, String username, long ttlSeconds) {
        if (!StringUtils.hasText(sub) || !StringUtils.hasText(username) || ttlSeconds <= 0) {
            return null;
        }
        return userRepository.findByUserNameAndIsDeletedFalse(username)
                .filter(user -> StatusBasic.ACTIVE.equals(user.getStatus()))
                .map(user -> cacheUserContext(username, user, loadUserPermissionsFromDb(user), (int) ttlSeconds))
                .orElse(null);
    }

    private MeResponse buildMeResponse(User user, String sub, Jwt jwt, PermissionCache permissionCache) {
        MeResponse response = modelMapper.map(user, MeResponse.class);
        response.setName(user.getPersonalName());
        response.setPreferredUsername(user.getUserName());
        response.setSub(sub);
        response.setEmailVerified(jwt != null ? jwt.getClaimAsBoolean("email_verified") : null);
        response.setModules(permissionCache.getModules());
        response.setPermissions(permissionCache.getFe());
        return response;
    }

    private PermissionFeView toFePermissionView(Permission permission) {
        return modelMapper.map(permission, PermissionFeView.class);
    }

    private PermissionBeView toBePermissionView(Permission permission) {
        return modelMapper.map(permission, PermissionBeView.class);
    }

    private Jwt getCurrentJwt() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            return jwt;
        }
        throw new BaseException("auth.user.current.not.found");
    }

}
