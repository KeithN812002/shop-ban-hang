package com.fpt.bom.sa.service;

import com.fpt.bom.sa.dto.user.external.ExternalUserCreateRequest;
import com.fpt.bom.sa.dto.user.external.ExternalUserDetailResponse;
import com.fpt.bom.sa.dto.user.external.ExternalUserFilterRequest;
import com.fpt.bom.sa.dto.user.external.ExternalUserResponse;
import com.fpt.bom.sa.dto.user.external.ExternalUserUpdateRequest;
import com.fpt.core.common.dto.PageResult;
import com.fpt.core.common.dto.UserOptionResponse;

import java.util.List;
import java.util.UUID;

/**
 * Author: hoanglm21@fpt.com
 * Date: 1/1/26
 */
public interface ExternalUserService {

    List<UserOptionResponse> options(String externalUnitCode);

    PageResult<ExternalUserResponse> search(ExternalUserFilterRequest filter);

    ExternalUserDetailResponse view(UUID id);

    void create(ExternalUserCreateRequest request);

    void update(ExternalUserUpdateRequest request);

    void active(UUID id);

    void inactive(UUID id);

    void delete(UUID id);

    void activeBulk(List<UUID> ids);

    void inactiveBulk(List<UUID> ids);

    void deleteBulk(List<UUID> ids);

    void resetPassword(UUID id);

    void resetPasswordBulk(List<UUID> ids);
}
