package com.fpt.bom.sa.service;

import java.util.UUID;

import com.fpt.bom.sa.dto.role.RoleDetailResponse;
import com.fpt.bom.sa.dto.role.RoleFilterRequest;
import com.fpt.bom.sa.dto.role.RoleCreateRequest;
import com.fpt.bom.sa.dto.role.RoleResponse;
import com.fpt.bom.sa.dto.role.RoleUpdateRequest;
import com.fpt.core.common.dto.OptionResponse;
import com.fpt.core.common.dto.PageResult;

import java.util.List;

/**
 * Author: hoanglm21@fpt.com
 * Date: 1/1/26
 */
public interface RoleService {

    List<OptionResponse> options();

    PageResult<RoleResponse> search(RoleFilterRequest filter);

    RoleDetailResponse view(UUID id);

    void create(RoleCreateRequest request);

    void update(RoleUpdateRequest request);

    void delete(UUID id);

    void active(UUID id);

    void inactive(UUID id);

    void activeBulk(List<UUID> ids);

    void inactiveBulk(List<UUID> ids);

    void deleteBulk(List<UUID> ids);
}