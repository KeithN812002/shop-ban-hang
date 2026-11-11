package com.fpt.bom.sa.dto.permission;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Author: hoanglm21@fpt.com
 * Date: 27/7/26
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionExportFile {

    private Integer version;

    private LocalDateTime exportedAt;

    private Integer count;

    private List<PermissionExportItem> permissions;
}
