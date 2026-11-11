package com.fpt.core.security.permission;

/**
 * Cache-miss fallback for the authorization filter: load a user's BE permissions from the
 * source of truth (DB), re-populate the permission cache, and return the permissions JSON
 * (same shape the filter consumes), or {@code null} if the user is unresolved/inactive.
 * Implemented in the business module; the filter depends only on this contract.
 */
public interface UserPermissionProvider {

    String loadAndCachePermissions(String sub, String username, long ttlSeconds);
}
