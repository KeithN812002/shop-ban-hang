package com.fpt.bom.sa.repository;

import java.util.UUID;

import com.fpt.bom.sa.entity.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

/**
 * Author: hoanglm21@fpt.com
 * Date: 1/1/26
 */
@Repository
public interface RolePermissionRepository extends JpaRepository<RolePermission, UUID> {

    List<RolePermission> findByRoleId(UUID roleId);

    List<RolePermission> findByRoleIdIn(Collection<UUID> roleId);

    void deleteByRoleId(UUID roleId);

    void deleteByRoleIdIn(Collection<UUID> roleIds);

    void deleteByPermissionIdIn(Collection<UUID> permissionId);

    @Query(value = """
            SELECT p.code AS permissionCode, r.code AS roleCode, r.name AS roleName
            FROM sa_role_permission rp
            JOIN sa_role r ON r.id = rp.role_id
            JOIN sa_permission p ON p.id = rp.permission_id
            WHERE p.code IN (:permissionCodes)
            ORDER BY p.code, r.code
            """, nativeQuery = true)
    List<PermissionRoleView> findRolesByPermissionCodeIn(
            @Param("permissionCodes") Collection<String> permissionCodes);
}
