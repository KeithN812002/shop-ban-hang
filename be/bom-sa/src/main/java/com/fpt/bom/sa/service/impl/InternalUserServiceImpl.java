package com.fpt.bom.sa.service.impl;

import com.fpt.bom.sa.constant.EmailEvents;
import com.fpt.bom.sa.dto.user.internal.InternalUserAssignRoleRequest;
import com.fpt.bom.sa.dto.user.internal.InternalUserDetailResponse;
import com.fpt.bom.sa.dto.user.internal.InternalUserFilterRequest;
import com.fpt.bom.sa.dto.user.internal.InternalUserResponse;
import com.fpt.bom.sa.entity.User;
import com.fpt.bom.sa.repository.UserRepository;
import com.fpt.bom.sa.service.InternalUserService;
import com.fpt.bom.sa.service.support.UserAccountSupport;
import com.fpt.bom.sa.service.support.UserSpecs;
import com.fpt.core.common.constant.Constants;
import com.fpt.core.common.dto.PageResult;
import com.fpt.core.common.dto.UserOptionResponse;
import com.fpt.core.common.enums.StatusBasic;
import com.fpt.core.persistence.spec.SpecificationBuilder;
import com.fpt.core.persistence.util.PageableUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.fpt.core.persistence.spec.JpaFieldSpecifications.*;

/**
 * Author: hoanglm21@fpt.com
 * Date: 1/1/26
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class InternalUserServiceImpl implements InternalUserService {

    private final UserRepository userRepository;
    private final ModelMapper modelMapper;
    private final UserAccountSupport userAccountSupport;

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "sa:user:internal-options", key = "#a0 != null ? #a0 : 'all'")
    public List<UserOptionResponse> options(UUID unitId) {
        Sort sort = Sort.by(Sort.Direction.ASC, "personalName");
        return userRepository.findAll(buildOptionsSpec(unitId), sort).stream()
                .map(user -> modelMapper.map(user, UserOptionResponse.class))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResult<InternalUserResponse> search(InternalUserFilterRequest filter) {
        Pageable pageable = PageableUtils.pageable(filter.getPageNumber() - 1, filter.getPageSize(),
                filter.getSortExpr());
        Page<User> page = userRepository.findAll(buildSearchSpec(filter), Objects.requireNonNull(pageable));
        PageResult<InternalUserResponse> result = PageableUtils.toPageResult(page,
                user -> modelMapper.map(user, InternalUserResponse.class));
        enrichNames(result.getItems());
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public InternalUserDetailResponse view(UUID id) {
        User user = userAccountSupport.requireScoped(id, true);
        InternalUserDetailResponse response = modelMapper.map(user, InternalUserDetailResponse.class);
        response.setGenderName(userAccountSupport.resolveGenderName(user.getGenderId()));
        return response;
    }

    @Override
    public void assignRoles(InternalUserAssignRoleRequest request) {
        User user = userAccountSupport.requireScoped(request.getId(), true);

        List<String> sanitizedRoles = userAccountSupport.requireValidRoles(request.getRoles(), user.getRoles());
        boolean rolesChanged = !new HashSet<>(Objects.requireNonNullElse(user.getRoles(), List.of()))
                .equals(new HashSet<>(sanitizedRoles));

        user.setRoles(sanitizedRoles);
        userRepository.save(user);

        if (rolesChanged) {
            userAccountSupport.queueUserEmail(EmailEvents.UPDATE_USER, user, null);
        }
    }

    @Override
    public void active(UUID id) {
        userAccountSupport.activate(id, true);
    }

    @Override
    public void inactive(UUID id) {
        userAccountSupport.deactivate(id, true);
    }

    @Override
    public void delete(UUID id) {
        userAccountSupport.softDelete(id, true);
    }

    @Override
    public void activeBulk(List<UUID> ids) {
        userAccountSupport.activateBulk(ids, true);
    }

    @Override
    public void inactiveBulk(List<UUID> ids) {
        userAccountSupport.deactivateBulk(ids, true);
    }

    @Override
    public void deleteBulk(List<UUID> ids) {
        userAccountSupport.softDeleteBulk(ids, true);
    }

    private Specification<User> buildSearchSpec(InternalUserFilterRequest filter) {
        SpecificationBuilder<User> builder = UserSpecs.accountScope(true);

        if (filter == null) {
            return builder.build();
        }

        UserSpecs.applyAccountFilters(builder, filter.getUserName(), filter.getPersonalName(), filter.getEmail(),
                filter.getStatus());
        builder.and(in("unitId", filter.getUnitId()));
        builder.and(in("departmentId", filter.getDepartmentId()));
        builder.and(in("positionId", filter.getPositionId()));
        builder.and(in("genderId", filter.getGenderId()));
        builder.and(auditFields(filter));
        applyUnassignedRole(builder, filter.getUnassignedRole());

        return builder.build();
    }

    private Specification<User> buildOptionsSpec(UUID unitId) {
        SpecificationBuilder<User> builder = new SpecificationBuilder<>();
        builder.and(eq("status", StatusBasic.ACTIVE));
        builder.and(eq("isDeleted", false));
        builder.and(eq("appCode", Constants.APP.CORE_APP));
        builder.and(eq("unitId", unitId));
        builder.and(eq("isInternal", true));
        return builder.build();
    }

    private void applyUnassignedRole(SpecificationBuilder<User> builder, Boolean unassignedRole) {
        if (unassignedRole == null) {
            return;
        }
        if (unassignedRole) {
            builder.and((root, query, cb) -> cb.or(
                    cb.isNull(root.get("roles")),
                    cb.equal(cb.function("cardinality", Integer.class, root.get("roles")), 0)));
        } else {
            builder.and((root, query, cb) -> cb.and(
                    cb.isNotNull(root.get("roles")),
                    cb.greaterThan(cb.function("cardinality", Integer.class, root.get("roles")), 0)));
        }
    }

    private void enrichNames(List<InternalUserResponse> users) {
        if (users == null || users.isEmpty()) {
            return;
        }

        Map<UUID, String> deptMap = userAccountSupport.departmentNames(users.stream()
                .map(InternalUserResponse::getDepartmentId).toList());
        Map<UUID, String> posMap = userAccountSupport.positionNames(users.stream()
                .map(InternalUserResponse::getPositionId).toList());
        Map<UUID, String> unitMap = userAccountSupport.unitNames(users.stream()
                .map(InternalUserResponse::getUnitId).toList());
        Map<UUID, String> genderMap = userAccountSupport.genderNames(users.stream()
                .map(InternalUserResponse::getGenderId).toList());

        users.forEach(user -> {
            if (user.getDepartmentId() != null) {
                user.setDepartmentName(deptMap.get(user.getDepartmentId()));
            }
            if (user.getPositionId() != null) {
                user.setPositionName(posMap.get(user.getPositionId()));
            }
            if (user.getUnitId() != null) {
                user.setUnitName(unitMap.get(user.getUnitId()));
            }
            if (user.getGenderId() != null) {
                user.setGenderName(genderMap.get(user.getGenderId()));
            }
        });
    }
}
