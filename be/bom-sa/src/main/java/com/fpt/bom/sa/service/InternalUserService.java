package com.fpt.bom.sa.service;

import com.fpt.bom.sa.dto.user.internal.InternalUserAssignRoleRequest;
import com.fpt.bom.sa.dto.user.internal.InternalUserDetailResponse;
import com.fpt.bom.sa.dto.user.internal.InternalUserFilterRequest;
import com.fpt.bom.sa.dto.user.internal.InternalUserResponse;
import com.fpt.core.common.dto.PageResult;
import com.fpt.core.common.dto.UserOptionResponse;

import java.util.List;
import java.util.UUID;

/**
 * Author: hoanglm21@fpt.com
 * Date: 1/1/26
 */
public interface InternalUserService {

    List<UserOptionResponse> options(UUID unitId);

    PageResult<InternalUserResponse> search(InternalUserFilterRequest filter);

    InternalUserDetailResponse view(UUID id);

    void assignRoles(InternalUserAssignRoleRequest request);

    void active(UUID id);

    void inactive(UUID id);

    void delete(UUID id);

    void activeBulk(List<UUID> ids);

    void inactiveBulk(List<UUID> ids);

    void deleteBulk(List<UUID> ids);
}
