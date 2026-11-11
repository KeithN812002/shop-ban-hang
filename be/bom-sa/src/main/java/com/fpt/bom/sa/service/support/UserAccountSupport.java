package com.fpt.bom.sa.service.support;

import com.fpt.core.email.dto.emailOutbox.EmailOutboxQueueTransfer;
import com.fpt.bom.sa.entity.Department;
import com.fpt.bom.sa.entity.Gender;
import com.fpt.bom.sa.entity.Position;
import com.fpt.bom.sa.entity.Role;
import com.fpt.bom.sa.entity.Unit;
import com.fpt.bom.sa.entity.User;
import com.fpt.bom.sa.repository.DepartmentRepository;
import com.fpt.bom.sa.repository.GenderRepository;
import com.fpt.bom.sa.repository.PositionRepository;
import com.fpt.bom.sa.repository.RoleRepository;
import com.fpt.bom.sa.repository.UnitRepository;
import com.fpt.bom.sa.repository.UserRepository;
import com.fpt.core.cache.service.CacheService;
import com.fpt.core.common.constant.Constants;
import com.fpt.bom.sa.constant.EmailEvents;
import com.fpt.core.common.enums.StatusBasic;
import com.fpt.core.common.exception.BaseException;
import com.fpt.core.common.properties.AppSsoProperties;
import com.fpt.core.email.service.EmailOutboxService;
import com.fpt.core.keycloak.services.KeycloakService;
import com.fpt.core.security.util.AesCryptoUtils;
import com.fpt.core.security.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.security.SecureRandom;
import java.util.stream.Collectors;

/**
 * Author: hoanglm21@fpt.com
 * Date: 1/1/26
 */
@Slf4j
@Component
@RequiredArgsConstructor
@Transactional
public class UserAccountSupport {

    private static final String OPTIONS_INTERNAL_CACHE = "sa:user:internal-options";
    private static final String OPTIONS_EXTERNAL_CACHE = "sa:user:external-options";
    private static final int DEFAULT_PASSWORD_LENGTH = 12;

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;
    private final UnitRepository unitRepository;
    private final GenderRepository genderRepository;
    private final RoleRepository roleRepository;
    private final EmailOutboxService emailOutboxService;
    private final AppSsoProperties appSsoProperties;
    private final AesCryptoUtils aesCryptoUtils;
    private final KeycloakService keycloakService;
    private final CacheService cacheService;

    @CacheEvict(value = { OPTIONS_INTERNAL_CACHE, OPTIONS_EXTERNAL_CACHE }, allEntries = true)
    public void activate(UUID id, boolean expectedInternal) {
        changeStatus(id, StatusBasic.ACTIVE, expectedInternal);
    }

    @CacheEvict(value = { OPTIONS_INTERNAL_CACHE, OPTIONS_EXTERNAL_CACHE }, allEntries = true)
    public void deactivate(UUID id, boolean expectedInternal) {
        changeStatus(id, StatusBasic.INACTIVE, expectedInternal);
    }

    @CacheEvict(value = { OPTIONS_INTERNAL_CACHE, OPTIONS_EXTERNAL_CACHE }, allEntries = true)
    public void softDelete(UUID id, boolean expectedInternal) {
        markDeleted(requireScoped(id, expectedInternal));
    }

    @CacheEvict(value = { OPTIONS_INTERNAL_CACHE, OPTIONS_EXTERNAL_CACHE }, allEntries = true)
    public void activateBulk(List<UUID> ids, boolean expectedInternal) {
        changeStatusBulk(ids, StatusBasic.ACTIVE, expectedInternal);
    }

    @CacheEvict(value = { OPTIONS_INTERNAL_CACHE, OPTIONS_EXTERNAL_CACHE }, allEntries = true)
    public void deactivateBulk(List<UUID> ids, boolean expectedInternal) {
        changeStatusBulk(ids, StatusBasic.INACTIVE, expectedInternal);
    }

    @CacheEvict(value = { OPTIONS_INTERNAL_CACHE, OPTIONS_EXTERNAL_CACHE }, allEntries = true)
    public void softDeleteBulk(List<UUID> ids, boolean expectedInternal) {
        List<User> users = requireScopedAll(ids, expectedInternal);
        users.forEach(this::markDeleted);
    }

    public void resetPassword(UUID id, boolean expectedInternal) {
        User user = requireScoped(id, expectedInternal);
        String randomPassword = generateRandomPassword();
        keycloakService.changeUserPassword(user.getUserName(), randomPassword, true);
        queueUserEmail(EmailEvents.RESET_PASSWORD, user, randomPassword);
    }

    public void resetPasswordBulk(List<UUID> ids, boolean expectedInternal) {
        for (User user : requireScopedAll(ids, expectedInternal)) {
            String randomPassword = generateRandomPassword();
            keycloakService.changeUserPassword(user.getUserName(), randomPassword, true);
            queueUserEmail(EmailEvents.RESET_PASSWORD, user, randomPassword);
        }
    }

    public User requireScoped(UUID id, boolean expectedInternal) {
        User user = userRepository.findByIdAndIsDeletedFalse(Objects.requireNonNull(id))
                .orElseThrow(() -> new BaseException("APP_DATA404"));
        if (Boolean.TRUE.equals(user.getIsInternal()) != expectedInternal) {
            throw new BaseException("APP_DATA404");
        }
        return user;
    }

    private List<User> requireScopedAll(List<UUID> ids, boolean expectedInternal) {
        List<User> users = userRepository.findByIdInAndIsDeletedFalse(Objects.requireNonNull(ids));
        if (users.size() != ids.size()) {
            throw new BaseException("APP_DATA404");
        }
        for (User user : users) {
            if (Boolean.TRUE.equals(user.getIsInternal()) != expectedInternal) {
                throw new BaseException("APP_DATA404");
            }
        }
        return users;
    }

    private void markDeleted(User user) {
        user.setStatus(StatusBasic.INACTIVE);
        user.setDeleted(true);
        user.setDeletedDate(LocalDateTime.now());
        user.setDeletedBy(SecurityUtils.getCurrentUsername());
        userRepository.save(user);
        revokeUserAccess(user.getUserName());
    }

    private void changeStatus(UUID id, StatusBasic status, boolean expectedInternal) {
        applyStatus(requireScoped(id, expectedInternal), status);
    }

    private void changeStatusBulk(List<UUID> ids, StatusBasic status, boolean expectedInternal) {
        requireScopedAll(ids, expectedInternal).forEach(user -> applyStatus(user, status));
    }

    private void applyStatus(User user, StatusBasic status) {
        user.setStatus(status);
        userRepository.save(user);
        if (StatusBasic.ACTIVE.equals(status)) {
            restoreUserAccess(user.getUserName());
        } else {
            revokeUserAccess(user.getUserName());
        }
    }

    public String createKeycloakUser(User user, String rawPassword) {
        return keycloakService.createUser(
                user.getUserName(), rawPassword, user.getEmail(),
                user.getPersonalName(), null,
                StatusBasic.ACTIVE.equals(user.getStatus()),
                String.valueOf(Boolean.TRUE.equals(user.getIsInternal())));
    }

    public void ensureKeycloakUser(User user) {
        boolean enabled = StatusBasic.ACTIVE.equals(user.getStatus());
        if (keycloakService.userExists(user.getUserName())) {
            keycloakService.setUserEnabled(user.getUserName(), enabled);
        } else {
            keycloakService.createUser(user.getUserName(), null, user.getEmail(),
                    user.getPersonalName(), null, enabled,
                    String.valueOf(Boolean.TRUE.equals(user.getIsInternal())));
        }
    }

    public void syncKeycloakProfile(User user) {
        try {
            keycloakService.updateUser(user.getUserName(), user.getEmail(),
                    user.getPersonalName(), null,
                    StatusBasic.ACTIVE.equals(user.getStatus()),
                    String.valueOf(Boolean.TRUE.equals(user.getIsInternal())));
        } catch (Exception e) {
            log.error("Failed to sync profile for user {} to Keycloak", user.getUserName(), e);
        }
    }

    public void rollbackKeycloakUser(String userName) {
        try {
            keycloakService.deleteUser(userName);
        } catch (Exception e) {
            log.error("Failed to rollback (delete) Keycloak user {} after DB failure", userName, e);
        }
    }

    public void restoreUserAccess(String userName) {
        try {
            keycloakService.setUserEnabled(userName, true);
        } catch (Exception e) {
            log.error("Failed to enable Keycloak user {}", userName, e);
        }
        cacheService.delete(Constants.SECURITY_FILTER.REDIS_KEY_USER_BLACKLIST_PREFIX + userName);
    }

    public void revokeUserAccess(String userName) {
        try {
            keycloakService.setUserEnabled(userName, false);
        } catch (Exception e) {
            log.error("Failed to disable Keycloak user {}", userName, e);
            throw new BaseException("user.keycloak.disable.failed");
        }
        cacheService.setString(Constants.SECURITY_FILTER.REDIS_KEY_USER_BLACKLIST_PREFIX + userName, "1",
                Constants.SECURITY_FILTER.USER_BLACKLIST_DEFAULT_TTL_SECONDS);
    }

    public void queueUserEmail(String eventType, User user, String plainPassword) {
        Map<String, String> variables = new LinkedHashMap<>();
        variables.put("{appName}", appSsoProperties.getAppName());
        variables.put("{fullName}", user.getPersonalName() != null ? user.getPersonalName() : "");
        variables.put("{roles}", resolveRoleNames(user.getRoles()));
        variables.put("{userName}", user.getUserName() != null ? user.getUserName() : "");
        if (plainPassword != null) {
            variables.put("{password}", aesCryptoUtils.encrypt(plainPassword));
        }
        variables.put("{loginUrl}", appSsoProperties.getLoginUrl() != null ? appSsoProperties.getLoginUrl() : "");

        emailOutboxService.queueEmail(EmailOutboxQueueTransfer.builder()
                .eventType(eventType)
                .receiver(user.getEmail())
                .variablesMap(variables)
                .build());
    }

    public String generateRandomPassword() {
        Map<String, Object> policy = keycloakService.getPasswordPolicy();
        int minUpper = Math.max(1, toPolicyInt(policy.get("minUpperCase")));
        int minLower = Math.max(1, toPolicyInt(policy.get("minLowerCase")));
        int minDigit = Math.max(1, toPolicyInt(policy.get("minDigits")));
        int minSpecial = Math.max(1, toPolicyInt(policy.get("minSpecialChars")));
        int targetLength = Math.max(Math.max(DEFAULT_PASSWORD_LENGTH, toPolicyInt(policy.get("minLength"))),
                minUpper + minLower + minDigit + minSpecial);
        return buildPasswordCandidate(targetLength, minUpper, minLower, minDigit, minSpecial);
    }

    private String buildPasswordCandidate(int targetLength, int minUpper, int minLower, int minDigit, int minSpecial) {
        SecureRandom r = new SecureRandom();
        List<Character> chars = new ArrayList<>();
        appendRandomChars(chars, Constants.PASSWORD.UPPER, minUpper, r);
        appendRandomChars(chars, Constants.PASSWORD.LOWER, minLower, r);
        appendRandomChars(chars, Constants.PASSWORD.DIGIT, minDigit, r);
        appendRandomChars(chars, Constants.PASSWORD.SPECIAL, minSpecial, r);

        String all = Constants.PASSWORD.UPPER + Constants.PASSWORD.LOWER
                + Constants.PASSWORD.DIGIT + Constants.PASSWORD.SPECIAL;
        while (chars.size() < targetLength) {
            chars.add(all.charAt(r.nextInt(all.length())));
        }
        Collections.shuffle(chars, r);
        StringBuilder sb = new StringBuilder(chars.size());
        chars.forEach(sb::append);
        return sb.toString();
    }

    private void appendRandomChars(List<Character> target, String source, int count, SecureRandom r) {
        for (int i = 0; i < count; i++) {
            target.add(source.charAt(r.nextInt(source.length())));
        }
    }

    private int toPolicyInt(Object value) {
        return value instanceof Number ? ((Number) value).intValue() : 0;
    }

    private List<String> sanitizeRoles(List<String> roleCodes, List<String> currentRoles) {
        List<String> current = Objects.requireNonNullElse(currentRoles, List.of());
        List<String> requested = Objects.requireNonNullElse(roleCodes, List.<String>of()).stream()
                .filter(c -> c != null && !c.isBlank())
                .distinct()
                .toList();
        Set<String> lookup = new LinkedHashSet<>(requested);
        lookup.addAll(current);
        if (lookup.isEmpty()) {
            return List.of();
        }
        Map<String, StatusBasic> statusByCode = roleRepository.findByCodeIn(new ArrayList<>(lookup)).stream()
                .collect(Collectors.toMap(Role::getCode, Role::getStatus, (a, b) -> a));

        List<String> result = new ArrayList<>();
        for (String code : requested) {
            StatusBasic status = statusByCode.get(code);
            if (StatusBasic.ACTIVE.equals(status) || (status != null && current.contains(code))) {
                result.add(code);
            }
        }
        current.stream()
                .filter(code -> statusByCode.containsKey(code)
                        && !StatusBasic.ACTIVE.equals(statusByCode.get(code))
                        && !result.contains(code))
                .forEach(result::add);

        List<String> dropped = requested.stream().filter(c -> !result.contains(c)).toList();
        if (!dropped.isEmpty()) {
            log.warn("Dropped role codes (missing or inactive): {}", dropped);
        }
        return result;
    }

    public List<String> requireValidRoles(List<String> roleCodes, List<String> currentRoles) {
        List<String> sanitized = sanitizeRoles(roleCodes, currentRoles);
        List<String> requested = Objects.requireNonNullElse(roleCodes, List.of());
        if (sanitized.stream().noneMatch(requested::contains)) {
            throw new BaseException("user.roles.invalid");
        }
        return sanitized;
    }

    private String resolveRoleNames(List<String> roleCodes) {
        if (roleCodes == null || roleCodes.isEmpty()) {
            return "";
        }
        return roleRepository.findByCodeIn(roleCodes).stream()
                .map(Role::getName)
                .filter(Objects::nonNull)
                .collect(Collectors.joining(", "));
    }

    @Transactional(readOnly = true)
    public String resolveGenderName(UUID genderId) {
        if (genderId == null) {
            return null;
        }
        return genderRepository.findByExtIdIn(List.of(genderId)).stream()
                .findFirst()
                .map(Gender::getName)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public Map<UUID, String> genderNames(Collection<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return Map.of();
        }
        return genderRepository.findByExtIdIn(distinct(ids)).stream()
                .collect(Collectors.toMap(Gender::getExtId, Gender::getName, (a, b) -> a));
    }

    @Transactional(readOnly = true)
    public Map<UUID, String> unitNames(Collection<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return Map.of();
        }
        return unitRepository.findByExtIdIn(distinct(ids)).stream()
                .collect(Collectors.toMap(Unit::getExtId, Unit::getName, (a, b) -> a));
    }

    @Transactional(readOnly = true)
    public Map<UUID, String> departmentNames(Collection<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return Map.of();
        }
        return departmentRepository.findByExtIdIn(distinct(ids)).stream()
                .collect(Collectors.toMap(Department::getExtId, Department::getName, (a, b) -> a));
    }

    @Transactional(readOnly = true)
    public Map<UUID, String> positionNames(Collection<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return Map.of();
        }
        return positionRepository.findByExtIdIn(distinct(ids)).stream()
                .collect(
                        Collectors.toMap(Position::getExtId, Position::getName, (a, b) -> a));
    }

    private List<UUID> distinct(Collection<UUID> ids) {
        return ids.stream().filter(Objects::nonNull).distinct().collect(Collectors.toList());
    }
}
