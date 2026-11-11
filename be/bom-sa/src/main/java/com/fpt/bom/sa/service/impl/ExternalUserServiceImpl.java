package com.fpt.bom.sa.service.impl;

import com.fpt.bom.sa.service.support.UserSpecs;
import com.fpt.bom.sa.dto.user.external.ExternalUserCreateRequest;
import com.fpt.bom.sa.dto.user.external.ExternalUserDetailResponse;
import com.fpt.bom.sa.dto.user.external.ExternalUserFilterRequest;
import com.fpt.bom.sa.dto.user.external.ExternalUserResponse;
import com.fpt.bom.sa.dto.user.external.ExternalUserUpdateRequest;
import com.fpt.bom.sa.entity.User;
import com.fpt.bom.sa.repository.UserRepository;
import com.fpt.bom.sa.service.ExternalUserService;
import com.fpt.bom.sa.service.support.UserAccountSupport;
import com.fpt.core.common.constant.Constants;
import com.fpt.core.common.dto.PageResult;
import com.fpt.core.common.dto.UserOptionResponse;
import com.fpt.bom.sa.constant.EmailEvents;
import com.fpt.core.common.enums.StatusBasic;
import com.fpt.core.common.exception.BaseException;
import com.fpt.core.persistence.spec.SpecificationBuilder;
import com.fpt.core.persistence.util.PageableUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.cache.annotation.CacheEvict;
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
public class ExternalUserServiceImpl implements ExternalUserService {

    private final UserRepository userRepository;
    private final ModelMapper modelMapper;
    private final UserAccountSupport userAccountSupport;

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "sa:user:external-options", key = "#a0 != null ? #a0 : 'all'")
    public List<UserOptionResponse> options(String externalUnitCode) {
        Sort sort = Sort.by(Sort.Direction.ASC, "personalName");
        return userRepository.findAll(buildOptionsSpec(externalUnitCode), sort).stream()
                .map(user -> modelMapper.map(user, UserOptionResponse.class))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResult<ExternalUserResponse> search(ExternalUserFilterRequest filter) {
        Pageable pageable = PageableUtils.pageable(filter.getPageNumber() - 1, filter.getPageSize(),
                filter.getSortExpr());
        Page<User> page = userRepository.findAll(buildSearchSpec(filter), Objects.requireNonNull(pageable));
        PageResult<ExternalUserResponse> result = PageableUtils.toPageResult(page,
                user -> modelMapper.map(user, ExternalUserResponse.class));
        enrichNames(result.getItems());
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public ExternalUserDetailResponse view(UUID id) {
        User user = userAccountSupport.requireScoped(id, false);
        ExternalUserDetailResponse response = modelMapper.map(user, ExternalUserDetailResponse.class);
        response.setGenderName(userAccountSupport.resolveGenderName(user.getGenderId()));
        return response;
    }

    @Override
    @CacheEvict(value = "sa:user:external-options", allEntries = true)
    public void create(ExternalUserCreateRequest request) {
        if (userRepository.existsByUserNameIgnoreCaseAndIsDeletedFalse(request.getUserName())) {
            throw new BaseException("user.userName.existed");
        }
        if (userRepository.existsByUserNameIgnoreCase(request.getUserName())) {
            throw new BaseException("user.userName.deletedExists");
        }
        User user = modelMapper.map(request, User.class);
        user.setRoles(userAccountSupport.requireValidRoles(request.getRoles(), null));
        user.setIsInternal(false);
        user.setAppCode(Constants.APP.CORE_APP);

        String randomPassword = userAccountSupport.generateRandomPassword();
        String keycloakUserId = userAccountSupport.createKeycloakUser(user, randomPassword);
        user.setExtId(UUID.fromString(keycloakUserId));

        try {
            userRepository.save(user);
        } catch (RuntimeException e) {
            userAccountSupport.rollbackKeycloakUser(user.getUserName());
            throw e;
        }

        userAccountSupport.queueUserEmail(EmailEvents.CREATE_USER, user, randomPassword);
    }

    @Override
    @CacheEvict(value = "sa:user:external-options", allEntries = true)
    public void update(ExternalUserUpdateRequest request) {
        User user = userRepository.findByIdAndIsDeletedFalse(Objects.requireNonNull(request.getId()))
                .orElseThrow(() -> new BaseException("APP_DATA404"));
        if (Boolean.TRUE.equals(user.getIsInternal())) {
            throw new BaseException("USER_ERR_INTERNAL_UPDATE");
        }

        List<String> sanitizedRoles = userAccountSupport.requireValidRoles(request.getRoles(), user.getRoles());
        boolean rolesChanged = !new HashSet<>(Objects.requireNonNullElse(user.getRoles(), List.of()))
                .equals(new HashSet<>(sanitizedRoles));
        boolean emailChanged = !Objects.equals(user.getEmail(), request.getEmail());
        boolean nameChanged = !Objects.equals(user.getPersonalName(), request.getPersonalName());

        modelMapper.map(request, user);
        user.setRoles(sanitizedRoles);
        userRepository.save(Objects.requireNonNull(user));

        if (emailChanged || nameChanged) {
            userAccountSupport.syncKeycloakProfile(user);
        }
        if (rolesChanged || emailChanged) {
            userAccountSupport.queueUserEmail(EmailEvents.UPDATE_USER, user, null);
        }
    }

    @Override
    public void active(UUID id) {
        userAccountSupport.activate(id, false);
    }

    @Override
    public void inactive(UUID id) {
        userAccountSupport.deactivate(id, false);
    }

    @Override
    public void delete(UUID id) {
        userAccountSupport.softDelete(id, false);
    }

    @Override
    public void activeBulk(List<UUID> ids) {
        userAccountSupport.activateBulk(ids, false);
    }

    @Override
    public void inactiveBulk(List<UUID> ids) {
        userAccountSupport.deactivateBulk(ids, false);
    }

    @Override
    public void deleteBulk(List<UUID> ids) {
        userAccountSupport.softDeleteBulk(ids, false);
    }

    @Override
    public void resetPassword(UUID id) {
        userAccountSupport.resetPassword(id, false);
    }

    @Override
    public void resetPasswordBulk(List<UUID> ids) {
        userAccountSupport.resetPasswordBulk(ids, false);
    }


    private Specification<User> buildSearchSpec(ExternalUserFilterRequest filter) {
        SpecificationBuilder<User> builder = UserSpecs.accountScope(false);

        if (filter == null) {
            return builder.build();
        }

        UserSpecs.applyAccountFilters(builder, filter.getUserName(), filter.getPersonalName(), filter.getEmail(),
                filter.getStatus());
        builder.and(in("externalUnitCode", filter.getExternalUnitCode()));
        builder.and(in("genderId", filter.getGenderId()));
        builder.and(auditFields(filter));

        return builder.build();
    }

    private Specification<User> buildOptionsSpec(String externalUnitCode) {
        SpecificationBuilder<User> builder = new SpecificationBuilder<>();
        builder.and(eq("status", StatusBasic.ACTIVE));
        builder.and(eq("isDeleted", false));
        builder.and(eq("appCode", Constants.APP.CORE_APP));
        builder.and(eq("externalUnitCode", externalUnitCode));
        builder.and(eq("isInternal", false));
        return builder.build();
    }

    private void enrichNames(List<ExternalUserResponse> users) {
        if (users == null || users.isEmpty()) {
            return;
        }

        Map<UUID, String> genderMap = userAccountSupport.genderNames(users.stream()
                .map(ExternalUserResponse::getGenderId).toList());

        users.forEach(user -> {
            if (user.getGenderId() != null) {
                user.setGenderName(genderMap.get(user.getGenderId()));
            }
        });
    }
}
