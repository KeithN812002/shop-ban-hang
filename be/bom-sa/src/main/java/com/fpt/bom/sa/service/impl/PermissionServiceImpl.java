package com.fpt.bom.sa.service.impl;

import java.util.UUID;

import com.fpt.bom.sa.dto.permission.*;
import com.fpt.bom.sa.entity.Permission;
import com.fpt.bom.sa.repository.PermissionRepository;
import com.fpt.bom.sa.repository.RolePermissionRepository;
import com.fpt.bom.sa.service.PermissionService;
import com.fpt.bom.sa.service.support.EndpointCatalog;
import com.fpt.bom.sa.service.support.PermissionImportSupport;
import com.fpt.core.common.constant.Constants;
import com.fpt.core.common.enums.MethodEnum;
import com.fpt.core.common.enums.StatusBasic;
import com.fpt.core.common.enums.PermissionEnum;
import com.fpt.core.common.exception.BaseException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Author: hoanglm21@fpt.com
 * Date: 1/1/26
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PermissionServiceImpl implements PermissionService {

    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final ModelMapper modelMapper;
    private final PermissionImportSupport permissionImportSupport;
    private final EndpointCatalog endpointCatalog;

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "sa:permission:all-active-for-role", key = "'all'")
    public List<PermissionResponse> allActiveForRole() {
        List<Permission> activePermissions = permissionRepository.findByStatusOrderBySortOrderAsc(StatusBasic.ACTIVE);

        Set<String> activeCodes = activePermissions.stream()
                .map(Permission::getCode)
                .collect(Collectors.toSet());

        return activePermissions.stream()
                .filter(permission -> permission.getParentCode() == null
                        || activeCodes.contains(permission.getParentCode()))
                .map(p -> modelMapper.map(p, PermissionResponse.class))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PermissionResponse> all() {
        return permissionRepository.findAll().stream()
                .map(p -> modelMapper.map(p, PermissionResponse.class))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PermissionDetailResponse view(UUID id) {
        Permission permission = permissionRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new BaseException("APP_DATA404"));

        List<Permission> functions = permissionRepository.findByParentCodeAndTypeOrderBySortOrderAsc(
                permission.getCode(), PermissionEnum.FUNCTION);
        List<Permission> apis = permissionRepository.findByParentCodeAndTypeOrderBySortOrderAsc(
                permission.getCode(), PermissionEnum.API);

        PermissionDetailResponse response = modelMapper.map(permission, PermissionDetailResponse.class);
        response.setFunctions(
                functions.stream().map(c -> modelMapper.map(c, PermissionFunctionResponse.class)).toList());
        response.setApis(apis.stream().map(c -> modelMapper.map(c, PermissionApiResponse.class)).toList());

        return response;
    }

    @Override
    @CacheEvict(value = "sa:permission:all-active-for-role", allEntries = true)
    public void create(PermissionCreateRequest request) {
        if (PermissionEnum.ROOT.equals(request.getType())) {
            throw new BaseException("permission.root.create.not.allowed");
        }

        Permission parent = permissionRepository.findByCode(Objects.requireNonNull(request.getParentCode()))
                .orElseThrow(() -> new BaseException("APP_DATA404"));

        validateParentType(parent, request.getType());

        request.setName(request.getName().trim());
        request.setUrlSegment(EndpointCatalog.normalizePath(request.getUrlSegment()));
        request.setUri(EndpointCatalog.normalizePath(request.getUri()));
        requireEndpoint(request.getMethod(), request.getUri());
        if (request.getFunctions() != null) {
            request.getFunctions().forEach(f -> {
                f.setUri(EndpointCatalog.normalizePath(f.getUri()));
                requireEndpoint(f.getMethod(), f.getUri());
            });
        }
        if (request.getApis() != null) {
            request.getApis().forEach(a -> {
                a.setUri(EndpointCatalog.normalizePath(a.getUri()));
                requireEndpoint(a.getMethod(), a.getUri());
            });
        }

        Long nextId = permissionRepository.getNextSequenceId();

        Permission permission = new Permission();
        applyCreateByType(permission, request);
        permission.setCode(String.format("%s_%06d", request.getType().name(), nextId));
        permission.setAppCode(Constants.APP.CORE_APP);
        permission.setModuleCode(parent.getModuleCode());
        permissionRepository.save(permission);

        saveChildren(permission, request);

        permissionRepository.refreshUrlByTree(permission.getCode());
    }

    @Override
    @CacheEvict(value = "sa:permission:all-active-for-role", allEntries = true)
    public void update(PermissionUpdateRequest request) {
        Permission permission = permissionRepository.findById(Objects.requireNonNull(request.getId()))
                .orElseThrow(() -> new BaseException("APP_DATA404"));

        request.setName(request.getName().trim());
        if (PermissionEnum.ROOT.equals(permission.getType())) {
            permission.setName(request.getName());
            permission.setForeignName(request.getForeignName());
            permission.setIcon(request.getIcon());
            permission.setSortOrder(request.getSortOrder());
            permission.setDescription(request.getDescription());
            permission.setStatus(request.getStatus());
            permissionRepository.save(permission);
            return;
        }

        Permission parent = permissionRepository.findByCode(Objects.requireNonNull(request.getParentCode()))
                .orElseThrow(() -> new BaseException("APP_DATA404"));

        validateParentType(parent, permission.getType());

        request.setUrlSegment(EndpointCatalog.normalizePath(request.getUrlSegment()));
        request.setUri(EndpointCatalog.normalizePath(request.getUri()));
        if (endpointChanged(permission, request.getMethod(), request.getUri())) {
            requireEndpoint(request.getMethod(), request.getUri());
        }

        String targetModuleCode = parent.getModuleCode();
        boolean moduleChanged = !Objects.equals(permission.getModuleCode(), targetModuleCode);

        String previousParentCode = permission.getParentCode();
        String previousUrlSegment = permission.getUrlSegment();

        applyUpdateByType(permission, request);
        permission.setModuleCode(targetModuleCode);
        permissionRepository.save(permission);

        if (moduleChanged) {
            permissionRepository.updateModuleCodeByTree(permission.getCode(), targetModuleCode);
        }

        boolean urlChanged = !Objects.equals(previousParentCode, permission.getParentCode())
                || !Objects.equals(previousUrlSegment, permission.getUrlSegment());
        if (urlChanged) {
            permissionRepository.refreshUrlByTree(permission.getCode());
        }

        syncChildren(permission, request);
    }

    @Override
    @CacheEvict(value = "sa:permission:all-active-for-role", allEntries = true)
    public void delete(UUID id) {
        Permission permission = permissionRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new BaseException("APP_DATA404"));

        if (PermissionEnum.ROOT.equals(permission.getType())) {
            throw new BaseException("permission.root.delete.not.allowed");
        }

        List<UUID> treePermissionIds = permissionRepository.findTreeIdsByParentCode(permission.getCode());
        if (treePermissionIds != null && !treePermissionIds.isEmpty()) {
            rolePermissionRepository.deleteByPermissionIdIn(treePermissionIds);
        }

        permissionRepository.deleteTreeByParentCode(permission.getCode());
    }

    @Override
    public byte[] exportAsJson() {
        return permissionImportSupport.exportAsJson();
    }

    @Override
    public PermissionImportPreviewResponse previewImport(MultipartFile file) {
        return permissionImportSupport.previewImport(file);
    }

    @Override
    public PermissionImportPreviewResponse applyImport(MultipartFile file, int confirmDeleteCount,
            boolean applyAdd, boolean applyUpdate, boolean applyDelete) {
        return permissionImportSupport.applyImport(file, confirmDeleteCount, applyAdd, applyUpdate, applyDelete);
    }

    private void validateParentType(Permission parent, PermissionEnum expectedChildType) {
        boolean valid = switch (parent.getType()) {
            case ROOT, GROUP ->
                PermissionEnum.GROUP.equals(expectedChildType) || PermissionEnum.MENU.equals(expectedChildType);
            case MENU, PAGE -> PermissionEnum.PAGE.equals(expectedChildType);
            default -> false;
        };
        if (!valid) {
            throw new BaseException("permission.type.not.allowed");
        }
    }

    private void applyCreateByType(Permission permission, PermissionCreateRequest request) {
        switch (request.getType()) {
            case GROUP -> modelMapper.map(modelMapper.map(request, PermissionGroupCreateTransfer.class), permission);
            case MENU -> modelMapper.map(modelMapper.map(request, PermissionMenuCreateTransfer.class), permission);
            case PAGE -> modelMapper.map(modelMapper.map(request, PermissionPageCreateTransfer.class), permission);
            default -> throw new BaseException("permission.function.api.create.not.allowed");
        }
    }

    private void applyUpdateByType(Permission permission, PermissionUpdateRequest request) {
        switch (permission.getType()) {
            case GROUP -> modelMapper.map(modelMapper.map(request, PermissionGroupUpdateTransfer.class), permission);
            case MENU -> modelMapper.map(modelMapper.map(request, PermissionMenuUpdateTransfer.class), permission);
            case PAGE -> modelMapper.map(modelMapper.map(request, PermissionPageUpdateTransfer.class), permission);
            default -> throw new BaseException("permission.function.api.update.not.allowed");
        }
    }

    private void saveChildren(Permission permission, PermissionCreateRequest request) {
        if (!PermissionEnum.MENU.equals(permission.getType())
                && !PermissionEnum.PAGE.equals(permission.getType())) {
            return;
        }
        if (request.getFunctions() != null && !request.getFunctions().isEmpty()) {
            for (PermissionFunctionCreateRequest funcReq : request.getFunctions()) {
                Permission function = modelMapper.map(funcReq, Permission.class);
                setupChildPermission(function, permission, PermissionEnum.FUNCTION,
                        permissionRepository.getNextSequenceId());
                permissionRepository.save(Objects.requireNonNull(function));
            }
        }
        if (request.getApis() != null && !request.getApis().isEmpty()) {
            for (PermissionApiCreateRequest apiReq : request.getApis()) {
                Permission api = modelMapper.map(apiReq, Permission.class);
                setupChildPermission(api, permission, PermissionEnum.API,
                        permissionRepository.getNextSequenceId());
                permissionRepository.save(Objects.requireNonNull(api));
            }
        }
    }

    private void syncChildren(Permission permission, PermissionUpdateRequest request) {
        if (!PermissionEnum.MENU.equals(permission.getType())
                && !PermissionEnum.PAGE.equals(permission.getType())) {
            return;
        }
        if (request.getFunctions() != null) {
            syncFunctions(permission, request.getFunctions());
        }
        if (request.getApis() != null) {
            syncApis(permission, request.getApis());
        }
    }

    private void syncFunctions(Permission permission, List<PermissionFunctionUpdateRequest> items) {
        syncEndpointChildren(permission, items, PermissionEnum.FUNCTION);
    }

    private void syncApis(Permission permission, List<PermissionApiUpdateRequest> items) {
        syncEndpointChildren(permission, items, PermissionEnum.API);
    }

    private void syncEndpointChildren(Permission permission, List<? extends PermissionEndpointItem> items,
            PermissionEnum type) {
        Map<UUID, Permission> own = ownChildren(permission, type);
        items.forEach(item -> {
            item.setUri(EndpointCatalog.normalizePath(item.getUri()));
            Permission existing = item.getId() != null ? own.get(item.getId()) : null;
            if (existing == null || endpointChanged(existing, item.getMethod(), item.getUri())) {
                requireEndpoint(item.getMethod(), item.getUri());
            }
        });
        deleteRemoved(own, items.stream().map(PermissionEndpointItem::getId).collect(Collectors.toSet()));
        for (PermissionEndpointItem item : items) {
            Permission existing = item.getId() != null ? own.get(item.getId()) : null;
            if (existing == null) {
                Permission child = modelMapper.map(item, Permission.class);
                child.setId(null);
                setupChildPermission(child, permission, type, permissionRepository.getNextSequenceId());
                permissionRepository.save(Objects.requireNonNull(child));
            } else {
                modelMapper.map(item, existing);
                permissionRepository.save(existing);
            }
        }
    }

    private Map<UUID, Permission> ownChildren(Permission parent, PermissionEnum type) {
        return permissionRepository.findByParentCodeAndTypeOrderBySortOrderAsc(parent.getCode(), type).stream()
                .collect(Collectors.toMap(Permission::getId, p -> p));
    }

    private void deleteRemoved(Map<UUID, Permission> own, Set<UUID> keptIds) {
        List<UUID> toDelete = own.keySet().stream().filter(id -> !keptIds.contains(id)).toList();
        if (!toDelete.isEmpty()) {
            rolePermissionRepository.deleteByPermissionIdIn(toDelete);
            permissionRepository.deleteAllById(toDelete);
        }
    }

    private boolean endpointChanged(Permission current, MethodEnum method, String uri) {
        return !Objects.equals(current.getMethod(), method)
                || !Objects.equals(EndpointCatalog.normalizePath(current.getUri()), uri);
    }

    private void requireEndpoint(MethodEnum method, String uri) {
        if (uri == null || uri.isBlank()) {
            return;
        }
        if (endpointCatalog.isUnknown(method, uri)) {
            throw new BaseException("permission.uri.notFound", (method != null ? method.name() : "?") + " " + uri);
        }
    }

    private void setupChildPermission(Permission child, Permission parent, PermissionEnum type, long nextId) {
        child.setCode(String.format("%s_%06d", type.name(), nextId));
        child.setParentCode(parent.getCode());
        child.setAppCode(Constants.APP.CORE_APP);
        child.setModuleCode(parent.getModuleCode());
        child.setType(type);
    }
}
