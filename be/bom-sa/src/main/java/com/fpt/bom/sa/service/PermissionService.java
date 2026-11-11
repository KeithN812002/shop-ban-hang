package com.fpt.bom.sa.service;

import java.util.UUID;

import com.fpt.bom.sa.dto.permission.PermissionCreateRequest;
import com.fpt.bom.sa.dto.permission.PermissionImportPreviewResponse;
import com.fpt.bom.sa.dto.permission.PermissionUpdateRequest;
import com.fpt.bom.sa.dto.permission.PermissionDetailResponse;
import com.fpt.bom.sa.dto.permission.PermissionResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Author: hoanglm21@fpt.com
 * Date: 1/1/26
 */
public interface PermissionService {

    List<PermissionResponse> allActiveForRole();

    List<PermissionResponse> all();

    PermissionDetailResponse view(UUID id);

    void create(PermissionCreateRequest request);

    void update(PermissionUpdateRequest request);

    void delete(UUID id);

    byte[] exportAsJson();

    PermissionImportPreviewResponse previewImport(MultipartFile file);

    PermissionImportPreviewResponse applyImport(MultipartFile file, int confirmDeleteCount,
            boolean applyAdd, boolean applyUpdate, boolean applyDelete);
}
