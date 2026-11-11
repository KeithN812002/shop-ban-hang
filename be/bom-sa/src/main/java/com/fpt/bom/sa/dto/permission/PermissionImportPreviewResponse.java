package com.fpt.bom.sa.dto.permission;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Author: hoanglm21@fpt.com
 * Date: 27/7/26
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionImportPreviewResponse {

    private Integer fileCount;

    private Integer currentCount;

    private List<String> blockers;

    private List<PermissionImportItemSummary> toAdd;

    private List<PermissionImportUpdateSummary> toUpdate;

    private List<PermissionImportDeleteSummary> toDelete;

    private List<PermissionImportRenameHint> renameHints;
    private List<String> uriWarnings;

    private Integer roleAssignmentsToDelete;
}
