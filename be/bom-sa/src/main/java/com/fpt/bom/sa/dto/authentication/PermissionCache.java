package com.fpt.bom.sa.dto.authentication;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Author: hoanglm21@fpt.com
 * Date: 1/1/26
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionCache {

    private List<String> modules;

    private List<PermissionFeView> fe;

    private List<PermissionBeView> be;
}
