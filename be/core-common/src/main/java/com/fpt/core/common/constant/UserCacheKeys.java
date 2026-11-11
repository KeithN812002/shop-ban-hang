package com.fpt.core.common.constant;

/**
 * Redis keys for per-user context cached at login (see AuthenticationService#me).
 * Single source of truth for the {@code user:{username}:{field}} scheme so writers and readers
 * across modules never drift apart.
 */
public final class UserCacheKeys {

    private static final String PREFIX = "user:";

    private UserCacheKeys() {
    }

    public static String unitId(String username) {
        return PREFIX + username + ":unitId";
    }

    public static String externalUnitCode(String username) {
        return PREFIX + username + ":externalUnitCode";
    }

    public static String permissions(String username) {
        return PREFIX + username + ":permissions";
    }
}
