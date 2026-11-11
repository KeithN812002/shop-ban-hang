package com.fpt.core.security.util;

import com.fpt.core.cache.service.CacheService;
import com.fpt.core.common.constant.Constants;
import com.fpt.core.common.constant.UserCacheKeys;
import com.fpt.core.common.exception.BaseException;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Optional;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class SecurityUtils {

    public static String getCurrentUsername() {
        SecurityContext securityContext = SecurityContextHolder.getContext();
        return Optional.ofNullable(extractPrincipal(securityContext.getAuthentication()))
                .orElse(Constants.SECURITY.UNKNOWN_USER);
    }

    public static String getCurrentSub() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            return jwt.getClaimAsString(Constants.JWT_CLAIMS.USER_ID);
        }
        return null;
    }

    public static Optional<String> getCurrentUnitId(CacheService cacheService) {
        return getCachedUserValue(cacheService, UserCacheKeys::unitId);
    }

    public static Optional<String> getCurrentExternalUnitCode(CacheService cacheService) {
        return getCachedUserValue(cacheService, UserCacheKeys::externalUnitCode);
    }

    public static Optional<String> getCurrentUnitCode(CacheService cacheService) {
        Optional<String> internal = getCurrentUnitId(cacheService);
        return internal.isPresent() ? internal : getCurrentExternalUnitCode(cacheService);
    }

    public static String requireCurrentUnitCode(CacheService cacheService) {
        return getCurrentUnitCode(cacheService)
                .orElseThrow(() -> new BaseException("APP_UNIT_NOT_FOUND"));
    }

    private static Optional<String> getCachedUserValue(CacheService cacheService,
            java.util.function.Function<String, String> keyBuilder) {
        String username = getCurrentUsername();
        if (username == null || username.isBlank() || Constants.SECURITY.UNKNOWN_USER.equals(username)) {
            return Optional.empty();
        }
        String value = cacheService.getString(keyBuilder.apply(username));
        return (value != null && !value.isBlank()) ? Optional.of(value) : Optional.empty();
    }

    private static String extractPrincipal(Authentication authentication) {
        if (authentication == null) {
            return null;
        }

        Object principal = authentication.getPrincipal();

        if (principal instanceof UserDetails springSecurityUser) {
            return springSecurityUser.getUsername();
        } else if (principal instanceof String stringPrincipal) {
            return stringPrincipal;
        } else if (principal instanceof Jwt jwt) {
            String username = jwt.getClaimAsString(Constants.JWT_CLAIMS.USER_NAME);
            return username != null ? username : jwt.getClaimAsString(Constants.JWT_CLAIMS.USER_ID);
        }

        return null;
    }
}
