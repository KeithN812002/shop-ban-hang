package com.fpt.bom.sa.service.support;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import com.fpt.bom.sa.dto.permission.PermissionExportFile;
import com.fpt.bom.sa.dto.permission.PermissionExportItem;
import com.fpt.bom.sa.dto.permission.PermissionImportFieldChange;
import com.fpt.bom.sa.dto.permission.PermissionImportDeleteSummary;
import com.fpt.bom.sa.dto.permission.PermissionImportItemSummary;
import com.fpt.bom.sa.dto.permission.PermissionImportPreviewResponse;
import com.fpt.bom.sa.dto.permission.PermissionImportRenameHint;
import com.fpt.bom.sa.dto.permission.PermissionImportRoleSummary;
import com.fpt.bom.sa.dto.permission.PermissionImportUpdateSummary;
import com.fpt.bom.sa.entity.Permission;
import com.fpt.bom.sa.repository.PermissionRepository;
import com.fpt.bom.sa.repository.PermissionRoleView;
import com.fpt.bom.sa.repository.RolePermissionRepository;
import com.fpt.core.cache.service.CacheService;
import com.fpt.core.common.exception.BaseException;
import com.fpt.core.common.util.MessageResolver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.BiConsumer;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Author: hoanglm21@fpt.com
 * Date: 27/7/26
 */
@Slf4j
@Component
@RequiredArgsConstructor
@Transactional
public class PermissionImportSupport {

    private static final int EXPORT_VERSION = 1;
    private static final String USER_PERMISSION_CACHE_PATTERN = "user:*:permissions";

    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final CacheService cacheService;
    private final AuditorAware<String> auditorAware;
    private final ObjectMapper objectMapper;
    private final MessageResolver messageResolver;
    private final EndpointCatalog endpointCatalog;

    private PermissionExportFile export() {
        List<PermissionExportItem> items = permissionRepository.findAll(Sort.by(Sort.Direction.ASC, "code")).stream()
                .map(this::toExportItem)
                .toList();

        return PermissionExportFile.builder()
                .version(EXPORT_VERSION)
                .exportedAt(LocalDateTime.now())
                .count(items.size())
                .permissions(items)
                .build();
    }

    @Transactional(readOnly = true)
    public byte[] exportAsJson() {
        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(export());
        } catch (JacksonException e) {
            log.error("Failed to serialize permission export", e);
            throw new BaseException("permission.export.failed", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public PermissionImportPreviewResponse previewImport(MultipartFile file) {
        return analyze(parse(file));
    }

    @CacheEvict(value = "sa:permission:all-active-for-role", allEntries = true)
    public PermissionImportPreviewResponse applyImport(MultipartFile file, int confirmDeleteCount,
            boolean applyAdd, boolean applyUpdate, boolean applyDelete) {
        if (!applyAdd && !applyUpdate && !applyDelete) {
            throw new BaseException("permission.import.nothing.selected");
        }

        PermissionExportFile parsed = parse(file);
        PermissionImportPreviewResponse plan = analyze(parsed);

        if (!plan.getBlockers().isEmpty()) {
            throw new BaseException("permission.import.blocked", String.join(" | ", plan.getBlockers()));
        }

        if (applyDelete && confirmDeleteCount != plan.getRoleAssignmentsToDelete()) {
            throw new BaseException("permission.import.confirm.mismatch",
                    String.format("confirmDeleteCount=%d, actual=%d",
                            confirmDeleteCount, plan.getRoleAssignmentsToDelete()));
        }

        Map<String, Permission> currentByCode = currentByCode();

        if (applyDelete) {
            Set<String> incomingCodes = parsed.getPermissions().stream()
                    .map(PermissionExportItem::getCode)
                    .collect(Collectors.toSet());

            List<UUID> removedIds = currentByCode.values().stream()
                    .filter(p -> !incomingCodes.contains(p.getCode()))
                    .map(Permission::getId)
                    .toList();

            if (!removedIds.isEmpty()) {
                rolePermissionRepository.deleteByPermissionIdIn(removedIds);
                rolePermissionRepository.flush();
                permissionRepository.deleteAllById(removedIds);
                permissionRepository.flush();
            }
        }

        LocalDateTime auditTime = LocalDateTime.now();
        String auditUser = auditorAware.getCurrentAuditor().orElse("system");

        List<PermissionExportItem> written = new ArrayList<>();
        for (PermissionExportItem item : parsed.getPermissions()) {
            Permission existing = currentByCode.get(item.getCode());
            if (existing == null) {
                if (applyAdd) {
                    insert(item, auditTime, auditUser);
                    written.add(item);
                }
            } else if (applyUpdate && differs(existing, item)) {
                copyInto(existing, item);
                permissionRepository.save(existing);
                written.add(item);
            }
        }

        if (!applyAdd) {
            assertParentsResolvable(written);
        }

        permissionRepository.syncSequence();
        cacheService.deleteByPattern(USER_PERMISSION_CACHE_PATTERN);

        log.info("Permission import applied: added={}, updated={}, deleted={}, roleAssignmentsCut={}, "
                + "flags[add={}, update={}, delete={}]",
                applyAdd ? plan.getToAdd().size() : 0,
                applyUpdate ? plan.getToUpdate().size() : 0,
                applyDelete ? plan.getToDelete().size() : 0,
                applyDelete ? plan.getRoleAssignmentsToDelete() : 0,
                applyAdd, applyUpdate, applyDelete);

        return plan;
    }

    private PermissionExportFile parse(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BaseException("permission.import.file.empty");
        }
        try {
            return objectMapper.readValue(file.getBytes(), PermissionExportFile.class);
        } catch (IOException e) {
            log.error("Failed to parse permission import file, name={}", file.getOriginalFilename(), e);
            throw new BaseException("permission.import.file.invalid", e.getMessage());
        }
    }

    private List<String> uriWarnings(List<PermissionExportItem> items) {
        return items.stream()
                .filter(item -> item.getUri() != null && !item.getUri().isBlank())
                .filter(item -> endpointCatalog.isUnknown(item.getMethod(), item.getUri()))
                .map(item -> item.getCode() + ": " + (item.getMethod() != null ? item.getMethod().name() : "?")
                        + " " + item.getUri())
                .sorted()
                .toList();
    }

    private PermissionImportPreviewResponse analyze(PermissionExportFile parsed) {
        List<String> blockers = new ArrayList<>();
        List<PermissionExportItem> items = parsed.getPermissions() == null ? List.of() : parsed.getPermissions();

        if (items.isEmpty()) {
            blockers.add(messageResolver.getMessage("permission.import.blocker.empty"));
        }
        if (parsed.getVersion() == null || parsed.getVersion() != EXPORT_VERSION) {
            blockers.add(messageResolver.getMessage("permission.import.blocker.version",
                    new Object[] { parsed.getVersion(), EXPORT_VERSION }));
        }
        if (parsed.getCount() == null || parsed.getCount() != items.size()) {
            blockers.add(messageResolver.getMessage("permission.import.blocker.count",
                    new Object[] { parsed.getCount(), items.size() }));
        }

        long missingKeys = items.stream()
                .filter(i -> i.getId() == null || i.getCode() == null || i.getCode().isBlank())
                .count();
        if (missingKeys > 0) {
            blockers.add(messageResolver.getMessage("permission.import.blocker.missingKey",
                    new Object[] { missingKeys }));
        }

        List<String> duplicatedCodes = duplicates(items, PermissionExportItem::getCode);
        if (!duplicatedCodes.isEmpty()) {
            blockers.add(messageResolver.getMessage("permission.import.blocker.duplicateCode",
                    new Object[] { String.join(", ", duplicatedCodes) }));
        }

        List<String> duplicatedIds = duplicates(items, i -> String.valueOf(i.getId()));
        if (!duplicatedIds.isEmpty()) {
            blockers.add(messageResolver.getMessage("permission.import.blocker.duplicateId",
                    new Object[] { String.join(", ", duplicatedIds) }));
        }

        Set<String> incomingCodes = items.stream()
                .map(PermissionExportItem::getCode)
                .collect(Collectors.toSet());

        List<String> orphanParents = items.stream()
                .filter(i -> i.getParentCode() != null && !i.getParentCode().isBlank())
                .filter(i -> !incomingCodes.contains(i.getParentCode()))
                .map(i -> i.getCode() + "->" + i.getParentCode())
                .sorted()
                .toList();
        if (!orphanParents.isEmpty()) {
            blockers.add(messageResolver.getMessage("permission.import.blocker.orphanParent",
                    new Object[] { String.join(", ", orphanParents) }));
        }

        Map<String, Permission> currentByCode = currentByCode();

        List<String> idMismatches = items.stream()
                .filter(i -> currentByCode.containsKey(i.getCode()))
                .filter(i -> !Objects.equals(currentByCode.get(i.getCode()).getId(), i.getId()))
                .map(PermissionExportItem::getCode)
                .sorted()
                .toList();
        if (!idMismatches.isEmpty()) {
            blockers.add(messageResolver.getMessage("permission.import.blocker.idMismatch",
                    new Object[] { String.join(", ", idMismatches) }));
        }

        List<PermissionImportItemSummary> toAdd = items.stream()
                .filter(i -> !currentByCode.containsKey(i.getCode()))
                .map(this::toSummary)
                .sorted(Comparator.comparing(PermissionImportItemSummary::getCode))
                .toList();

        List<PermissionImportUpdateSummary> toUpdate = items.stream()
                .filter(i -> currentByCode.containsKey(i.getCode()))
                .map(i -> Map.entry(i, changes(currentByCode.get(i.getCode()), i)))
                .filter(e -> !e.getValue().isEmpty())
                .map(e -> PermissionImportUpdateSummary.builder()
                        .code(e.getKey().getCode())
                        .type(e.getKey().getType())
                        .moduleCode(e.getKey().getModuleCode())
                        .name(e.getKey().getName())
                        .changes(e.getValue())
                        .build())
                .sorted(Comparator.comparing(PermissionImportUpdateSummary::getCode))
                .toList();

        List<Permission> removed = currentByCode.values().stream()
                .filter(p -> !incomingCodes.contains(p.getCode()))
                .sorted(Comparator.comparing(Permission::getCode))
                .toList();

        Map<String, List<PermissionImportRoleSummary>> rolesByPermission = removed.isEmpty()
                ? Map.of()
                : rolePermissionRepository.findRolesByPermissionCodeIn(
                        removed.stream().map(Permission::getCode).toList()).stream()
                        .collect(Collectors.groupingBy(PermissionRoleView::getPermissionCode,
                                LinkedHashMap::new,
                                Collectors.mapping(pair -> PermissionImportRoleSummary.builder()
                                        .code(pair.getRoleCode())
                                        .name(pair.getRoleName())
                                        .build(), Collectors.toList())));

        List<PermissionImportDeleteSummary> toDelete = removed.stream()
                .map(p -> PermissionImportDeleteSummary.builder()
                        .code(p.getCode())
                        .type(p.getType())
                        .moduleCode(p.getModuleCode())
                        .name(p.getName())
                        .parentCode(p.getParentCode())
                        .uri(p.getUri())
                        .buttonAction(p.getButtonAction())
                        .roles(rolesByPermission.getOrDefault(p.getCode(), List.of()))
                        .build())
                .toList();

        int roleAssignmentsToDelete = rolesByPermission.values().stream().mapToInt(List::size).sum();

        return PermissionImportPreviewResponse.builder()
                .fileCount(items.size())
                .currentCount(currentByCode.size())
                .blockers(blockers)
                .toAdd(toAdd)
                .toUpdate(toUpdate)
                .toDelete(toDelete)
                .renameHints(renameHints(items, currentByCode, incomingCodes))
                .uriWarnings(uriWarnings(items))
                .roleAssignmentsToDelete(roleAssignmentsToDelete)
                .build();
    }

    private List<PermissionImportRenameHint> renameHints(List<PermissionExportItem> items,
            Map<String, Permission> currentByCode, Set<String> incomingCodes) {
        List<PermissionExportItem> newcomers = items.stream()
                .filter(i -> !currentByCode.containsKey(i.getCode()))
                .filter(i -> i.getUri() != null && !i.getUri().isBlank())
                .toList();

        if (newcomers.isEmpty()) {
            return List.of();
        }

        List<Permission> disappearing = currentByCode.values().stream()
                .filter(p -> !incomingCodes.contains(p.getCode()))
                .filter(p -> p.getUri() != null && !p.getUri().isBlank())
                .toList();

        List<PermissionImportRenameHint> hints = new ArrayList<>();
        for (Permission gone : disappearing) {
            for (PermissionExportItem incoming : newcomers) {
                boolean sameEndpoint = Objects.equals(gone.getUri(), incoming.getUri())
                        && Objects.equals(gone.getMethod(), incoming.getMethod())
                        && Objects.equals(gone.getButtonAction(), incoming.getButtonAction());
                if (sameEndpoint) {
                    hints.add(PermissionImportRenameHint.builder()
                            .currentCode(gone.getCode())
                            .incomingCode(incoming.getCode())
                            .uri(gone.getUri())
                            .buttonAction(gone.getButtonAction())
                            .name(gone.getName())
                            .build());
                }
            }
        }
        return hints;
    }

    private void assertParentsResolvable(List<PermissionExportItem> written) {
        if (written.isEmpty()) {
            return;
        }
        permissionRepository.flush();
        Set<String> codesAfter = currentByCode().keySet();
        List<String> orphans = written.stream()
                .filter(i -> i.getParentCode() != null && !i.getParentCode().isBlank())
                .filter(i -> !codesAfter.contains(i.getParentCode()))
                .map(i -> i.getCode() + "->" + i.getParentCode())
                .sorted()
                .toList();
        if (!orphans.isEmpty()) {
            throw new BaseException("permission.import.partial.orphan", String.join(", ", orphans));
        }
    }

    private Map<String, Permission> currentByCode() {
        return permissionRepository.findAll().stream()
                .collect(Collectors.toMap(Permission::getCode, Function.identity(),
                        (a, b) -> a, LinkedHashMap::new));
    }

    private List<String> duplicates(List<PermissionExportItem> items, Function<PermissionExportItem, String> key) {
        return items.stream()
                .collect(Collectors.groupingBy(key, LinkedHashMap::new, Collectors.counting()))
                .entrySet().stream()
                .filter(e -> e.getValue() > 1)
                .map(Map.Entry::getKey)
                .toList();
    }

    private PermissionExportItem toExportItem(Permission permission) {
        return PermissionExportItem.builder()
                .id(permission.getId())
                .code(permission.getCode())
                .name(permission.getName())
                .foreignName(permission.getForeignName())
                .parentCode(permission.getParentCode())
                .appCode(permission.getAppCode())
                .moduleCode(permission.getModuleCode())
                .type(permission.getType())
                .url(permission.getUrl())
                .urlSegment(permission.getUrlSegment())
                .pathFolder(permission.getPathFolder())
                .uri(permission.getUri())
                .method(permission.getMethod())
                .buttonAction(permission.getButtonAction())
                .icon(permission.getIcon())
                .sortOrder(permission.getSortOrder())
                .description(permission.getDescription())
                .status(permission.getStatus())
                .build();
    }

    private PermissionImportItemSummary toSummary(PermissionExportItem item) {
        return PermissionImportItemSummary.builder()
                .code(item.getCode())
                .type(item.getType())
                .moduleCode(item.getModuleCode())
                .name(item.getName())
                .parentCode(item.getParentCode())
                .uri(item.getUri())
                .buttonAction(item.getButtonAction())
                .build();
    }

    private record FieldSpec(
            String name,
            Function<Permission, Object> current,
            Function<PermissionExportItem, Object> incoming,
            BiConsumer<Permission, PermissionExportItem> apply) {
    }

    private static final List<FieldSpec> FIELDS = List.of(
            new FieldSpec("name", Permission::getName, PermissionExportItem::getName,
                    (p, i) -> p.setName(i.getName())),
            new FieldSpec("foreignName", Permission::getForeignName, PermissionExportItem::getForeignName,
                    (p, i) -> p.setForeignName(i.getForeignName())),
            new FieldSpec("parentCode", Permission::getParentCode, PermissionExportItem::getParentCode,
                    (p, i) -> p.setParentCode(i.getParentCode())),
            new FieldSpec("appCode", Permission::getAppCode, PermissionExportItem::getAppCode,
                    (p, i) -> p.setAppCode(i.getAppCode())),
            new FieldSpec("moduleCode", Permission::getModuleCode, PermissionExportItem::getModuleCode,
                    (p, i) -> p.setModuleCode(i.getModuleCode())),
            new FieldSpec("type", Permission::getType, PermissionExportItem::getType,
                    (p, i) -> p.setType(i.getType())),
            new FieldSpec("url", Permission::getUrl, PermissionExportItem::getUrl,
                    (p, i) -> p.setUrl(i.getUrl())),
            new FieldSpec("urlSegment", Permission::getUrlSegment, PermissionExportItem::getUrlSegment,
                    (p, i) -> p.setUrlSegment(i.getUrlSegment())),
            new FieldSpec("pathFolder", Permission::getPathFolder, PermissionExportItem::getPathFolder,
                    (p, i) -> p.setPathFolder(i.getPathFolder())),
            new FieldSpec("uri", Permission::getUri, PermissionExportItem::getUri,
                    (p, i) -> p.setUri(i.getUri())),
            new FieldSpec("method", Permission::getMethod, PermissionExportItem::getMethod,
                    (p, i) -> p.setMethod(i.getMethod())),
            new FieldSpec("buttonAction", Permission::getButtonAction, PermissionExportItem::getButtonAction,
                    (p, i) -> p.setButtonAction(i.getButtonAction())),
            new FieldSpec("icon", Permission::getIcon, PermissionExportItem::getIcon,
                    (p, i) -> p.setIcon(i.getIcon())),
            new FieldSpec("sortOrder", Permission::getSortOrder, PermissionExportItem::getSortOrder,
                    (p, i) -> p.setSortOrder(i.getSortOrder())),
            new FieldSpec("description", Permission::getDescription, PermissionExportItem::getDescription,
                    (p, i) -> p.setDescription(i.getDescription())),
            new FieldSpec("status", Permission::getStatus, PermissionExportItem::getStatus,
                    (p, i) -> p.setStatus(i.getStatus())));

    private List<PermissionImportFieldChange> changes(Permission current, PermissionExportItem incoming) {
        List<PermissionImportFieldChange> result = new ArrayList<>();
        for (FieldSpec field : FIELDS) {
            Object oldValue = blankToNull(field.current().apply(current));
            Object newValue = blankToNull(field.incoming().apply(incoming));
            if (!Objects.equals(oldValue, newValue)) {
                result.add(PermissionImportFieldChange.builder()
                        .field(field.name())
                        .oldValue(oldValue == null ? null : String.valueOf(oldValue))
                        .newValue(newValue == null ? null : String.valueOf(newValue))
                        .build());
            }
        }
        return result;
    }

    private static Object blankToNull(Object value) {
        if (value instanceof String text) {
            return text.isBlank() ? null : text;
        }
        return value;
    }

    private boolean differs(Permission current, PermissionExportItem incoming) {
        return !changes(current, incoming).isEmpty();
    }

    private void copyInto(Permission target, PermissionExportItem source) {
        FIELDS.forEach(field -> field.apply().accept(target, source));
    }

    private void insert(PermissionExportItem item, LocalDateTime auditTime, String auditUser) {
        permissionRepository.insertWithExplicitId(
                item.getId(),
                item.getCode(),
                item.getName(),
                item.getForeignName(),
                item.getParentCode(),
                item.getAppCode(),
                item.getModuleCode(),
                item.getType() == null ? null : item.getType().name(),
                item.getUrl(),
                item.getUrlSegment(),
                item.getPathFolder(),
                item.getUri(),
                item.getMethod() == null ? null : item.getMethod().name(),
                item.getButtonAction(),
                item.getIcon(),
                item.getSortOrder(),
                item.getDescription(),
                item.getStatus() == null ? null : item.getStatus().name(),
                auditTime,
                auditUser);
    }
}
