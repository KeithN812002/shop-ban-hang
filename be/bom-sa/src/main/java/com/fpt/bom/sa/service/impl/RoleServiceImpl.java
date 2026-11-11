package com.fpt.bom.sa.service.impl;

import java.util.UUID;

import com.fpt.bom.sa.entity.Permission;
import com.fpt.bom.sa.entity.Role;
import com.fpt.bom.sa.dto.role.RoleDetailResponse;
import com.fpt.bom.sa.dto.role.RoleFilterRequest;
import com.fpt.bom.sa.dto.role.RoleCreateRequest;
import com.fpt.bom.sa.dto.role.RoleUpdateRequest;
import com.fpt.bom.sa.dto.role.RoleResponse;
import com.fpt.bom.sa.entity.RolePermission;
import com.fpt.bom.sa.repository.PermissionRepository;
import com.fpt.bom.sa.repository.RolePermissionRepository;
import com.fpt.bom.sa.repository.RoleRepository;
import com.fpt.bom.sa.repository.UserRepository;
import com.fpt.bom.sa.service.RoleService;
import com.fpt.core.common.constant.Constants;
import com.fpt.core.common.dto.OptionResponse;
import com.fpt.core.common.enums.StatusBasic;
import com.fpt.core.common.exception.BaseException;
import com.fpt.core.common.dto.PageResult;
import com.fpt.core.persistence.spec.SpecificationBuilder;
import com.fpt.core.persistence.util.PageableUtils;
import com.fpt.core.security.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.stream.Collectors;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import static com.fpt.core.persistence.spec.JpaFieldSpecifications.auditFields;
import static com.fpt.core.persistence.spec.JpaFieldSpecifications.eq;
import static com.fpt.core.persistence.spec.JpaFieldSpecifications.in;
import static com.fpt.core.persistence.spec.JpaStringSpecifications.like;

/**
 * Author: hoanglm21@fpt.com
 * Date: 1/1/26
 */
@Service
@RequiredArgsConstructor
@Transactional
public class RoleServiceImpl implements RoleService {

    private final RoleRepository roleRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final PermissionRepository permissionRepository;
    private final UserRepository userRepository;
    private final ModelMapper modelMapper;

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "sa:role:options", key = "'all'")
    public List<OptionResponse> options() {
        Sort sort = Sort.by(Sort.Direction.ASC, "name");
        return roleRepository.findAll(buildOptionsSpec(), sort).stream()
                .map(role -> modelMapper.map(role, OptionResponse.class)).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResult<RoleResponse> search(RoleFilterRequest filter) {
        Pageable pageable = PageableUtils.pageable(filter.getPageNumber() - 1, filter.getPageSize(),
                filter.getSortExpr());
        Page<Role> page = roleRepository.findAll(buildSearchSpec(filter), Objects.requireNonNull(pageable));
        return PageableUtils.toPageResult(page, role -> modelMapper.map(role, RoleResponse.class));
    }

    @Override
    @Transactional(readOnly = true)
    public RoleDetailResponse view(UUID id) {
        Role role = roleRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new BaseException("APP_DATA404"));
        RoleDetailResponse response = modelMapper.map(role, RoleDetailResponse.class);
        List<UUID> permissionIds = rolePermissionRepository.findByRoleId(role.getId()).stream()
                .map(RolePermission::getPermissionId)
                .toList();
        response.setPermissionIds(permissionIds);
        return response;
    }

    @Override
    @CacheEvict(value = "sa:role:options", allEntries = true)
    public void create(RoleCreateRequest request) {
        request.setName(request.getName().trim());
        if (roleRepository.existsByNameIgnoreCase(request.getName())) {
            throw new BaseException("role.name.existed");
        }

        Role role = modelMapper.map(request, Role.class);

        Long nextNum = roleRepository.getNextSequenceId();
        role.setCode(String.format("ROLE_%06d", nextNum));
        role.setAppCode(Constants.APP.CORE_APP);
        roleRepository.save(role);

        replaceRolePermissions(role, request.getPermissionIds());
    }

    @Override
    @CacheEvict(value = "sa:role:options", allEntries = true)
    public void update(RoleUpdateRequest request) {
        request.setName(request.getName().trim());
        if (roleRepository.existsByNameIgnoreCaseAndIdNot(request.getName(), request.getId())) {
            throw new BaseException("role.name.existed");
        }
        Role role = roleRepository.findById(Objects.requireNonNull(request.getId()))
                .orElseThrow(() -> new BaseException("APP_DATA404"));
        modelMapper.map(request, role);
        role.setUpdatedDate(null);
        role.setUpdatedBy(null);
        roleRepository.save(Objects.requireNonNull(role));

        replaceRolePermissions(role, request.getPermissionIds());
    }

    @Override
    @CacheEvict(value = "sa:role:options", allEntries = true)
    public void delete(UUID id) {
        Role role = roleRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new BaseException("APP_DATA404"));
        userRepository.removeRoleCode(role.getCode(), SecurityUtils.getCurrentUsername());
        rolePermissionRepository.deleteByRoleId(Objects.requireNonNull(role.getId()));
        roleRepository.deleteById(Objects.requireNonNull(role.getId()));
    }

    @Override
    @CacheEvict(value = "sa:role:options", allEntries = true)
    public void active(UUID id) {
        changeStatus(id, StatusBasic.ACTIVE);
    }

    @Override
    @CacheEvict(value = "sa:role:options", allEntries = true)
    public void inactive(UUID id) {
        changeStatus(id, StatusBasic.INACTIVE);
    }

    @Override
    @CacheEvict(value = "sa:role:options", allEntries = true)
    public void activeBulk(List<UUID> ids) {
        changeStatusBulk(ids, StatusBasic.ACTIVE);
    }

    @Override
    @CacheEvict(value = "sa:role:options", allEntries = true)
    public void inactiveBulk(List<UUID> ids) {
        changeStatusBulk(ids, StatusBasic.INACTIVE);
    }

    @Override
    @CacheEvict(value = "sa:role:options", allEntries = true)
    public void deleteBulk(List<UUID> ids) {
        List<Role> roles = requireAll(ids);
        String updatedBy = SecurityUtils.getCurrentUsername();
        roles.forEach(role -> userRepository.removeRoleCode(role.getCode(), updatedBy));
        List<UUID> roleIds = roles.stream().map(Role::getId).toList();
        rolePermissionRepository.deleteByRoleIdIn(roleIds);
        rolePermissionRepository.flush();
        roleRepository.deleteAllById(roleIds);
    }

    private Specification<Role> buildOptionsSpec() {
        SpecificationBuilder<Role> builder = new SpecificationBuilder<>();
        builder.and(eq("appCode", Constants.APP.CORE_APP));
        builder.and(eq("status", StatusBasic.ACTIVE));
        return builder.build();
    }

    private Specification<Role> buildSearchSpec(RoleFilterRequest filter) {
        SpecificationBuilder<Role> builder = new SpecificationBuilder<>();

        if (filter == null) {
            return builder.build();
        }

        builder.and(eq("appCode", Constants.APP.CORE_APP));
        builder.and(like("code", filter.getCode()));
        builder.and(like("name", filter.getName()));
        builder.and(in("status", filter.getStatus()));
        builder.and(auditFields(filter));
        return builder.build();
    }

    private void changeStatus(UUID id, StatusBasic status) {
        Role role = roleRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new BaseException("APP_DATA404"));
        role.setStatus(status);
        roleRepository.save(role);
    }

    private void changeStatusBulk(List<UUID> ids, StatusBasic status) {
        List<Role> roles = requireAll(ids);
        roles.forEach(role -> role.setStatus(status));
        roleRepository.saveAll(roles);
    }

    private List<Role> requireAll(List<UUID> ids) {
        List<Role> roles = roleRepository.findAllById(Objects.requireNonNull(ids));
        if (roles.size() != ids.size()) {
            throw new BaseException("APP_DATA404");
        }
        return roles;
    }

    private void replaceRolePermissions(Role role, List<UUID> permissionIds) {
        UUID roleId = Objects.requireNonNull(role.getId());
        Set<UUID> previousIds = rolePermissionRepository.findByRoleId(roleId).stream()
                .map(RolePermission::getPermissionId)
                .collect(Collectors.toSet());

        List<UUID> requestedIds = Objects.requireNonNullElse(permissionIds, List.<UUID>of()).stream()
                .distinct()
                .toList();
        if (requestedIds.contains(null)) {
            throw new BaseException("role.permissionIds.invalid");
        }
        Map<UUID, Permission> requested = permissionRepository.findAllById(requestedIds).stream()
                .collect(Collectors.toMap(Permission::getId, p -> p));
        boolean hasInvalid = requestedIds.stream().anyMatch(id -> {
            Permission permission = requested.get(id);
            return permission == null
                    || (!StatusBasic.ACTIVE.equals(permission.getStatus()) && !previousIds.contains(id));
        });
        if (hasInvalid) {
            throw new BaseException("role.permissionIds.invalid");
        }
        if (requested.values().stream().noneMatch(p -> StatusBasic.ACTIVE.equals(p.getStatus()))) {
            throw new BaseException("role.permissionIds.notEmpty");
        }

        Set<UUID> existingPermissionIds = new LinkedHashSet<>(requestedIds);
        permissionRepository.findAllById(previousIds).stream()
                .filter(p -> !StatusBasic.ACTIVE.equals(p.getStatus()))
                .forEach(p -> existingPermissionIds.add(p.getId()));

        rolePermissionRepository.deleteByRoleId(roleId);
        rolePermissionRepository.flush();

        List<RolePermission> mappings = existingPermissionIds.stream().map(permissionId -> {
            RolePermission mapping = new RolePermission();
            mapping.setRoleId(roleId);
            mapping.setPermissionId(permissionId);
            mapping.setAppCode(role.getAppCode());
            mapping.setStatus(StatusBasic.ACTIVE);
            return mapping;
        }).toList();

        rolePermissionRepository.saveAll(Objects.requireNonNull(mappings));
    }
}
