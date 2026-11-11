package com.fpt.bom.sa.repository;

import java.util.UUID;

import com.fpt.bom.sa.entity.Permission;
import com.fpt.core.common.enums.PermissionEnum;
import com.fpt.core.common.enums.StatusBasic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Author: hoanglm21@fpt.com
 * Date: 1/1/26
 */
@Repository
public interface PermissionRepository extends JpaRepository<Permission, UUID> {

    @Query(value = "SELECT nextval('sa_permission_seq')", nativeQuery = true)
    Long getNextSequenceId();

    @Query(value = """
            SELECT setval(
                'sa_permission_seq',
                COALESCE(
                    (SELECT MAX(CAST(regexp_replace(code, '^.*_', '') AS bigint))
                     FROM sa_permission
                     WHERE code ~ '_[0-9]+$'),
                    0
                ) + 1,
                false
            )
            """, nativeQuery = true)
    void syncSequence();

    @Modifying
    @Query(value = """
            INSERT INTO sa_permission (
                id, code, name, foreign_name, parent_code, app_code, module_code, type,
                url, url_segment, path_folder, uri, method, button_action, icon,
                sort_order, description, status,
                created_date, created_by, updated_date, updated_by)
            VALUES (
                :id, :code, :name, :foreignName, :parentCode, :appCode, :moduleCode,
                CAST(:type AS permission_type),
                :url, :urlSegment, :pathFolder, :uri,
                CAST(:method AS http_method),
                :buttonAction, :icon, :sortOrder, :description,
                CAST(:status AS status_basic),
                :auditTime, :auditUser, :auditTime, :auditUser)
            """, nativeQuery = true)
    void insertWithExplicitId(@Param("id") UUID id,
            @Param("code") String code,
            @Param("name") String name,
            @Param("foreignName") String foreignName,
            @Param("parentCode") String parentCode,
            @Param("appCode") String appCode,
            @Param("moduleCode") String moduleCode,
            @Param("type") String type,
            @Param("url") String url,
            @Param("urlSegment") String urlSegment,
            @Param("pathFolder") String pathFolder,
            @Param("uri") String uri,
            @Param("method") String method,
            @Param("buttonAction") String buttonAction,
            @Param("icon") String icon,
            @Param("sortOrder") Integer sortOrder,
            @Param("description") String description,
            @Param("status") String status,
            @Param("auditTime") LocalDateTime auditTime,
            @Param("auditUser") String auditUser);

    Optional<Permission> findByCode(String code);

    List<Permission> findByStatusOrderBySortOrderAsc(StatusBasic status);

    List<Permission> findByIdIn(Collection<UUID> id);

    List<Permission> findByParentCodeAndTypeOrderBySortOrderAsc(String parentCode, PermissionEnum type);

    @Query(value = """
            WITH RECURSIVE tree AS (
                SELECT id, code, parent_code FROM sa_permission WHERE code = :parentCode
                UNION ALL
                SELECT p.id, p.code, p.parent_code
                FROM sa_permission p
                JOIN tree t ON p.parent_code = t.code
            )
            SELECT id FROM tree
            """, nativeQuery = true)
    List<UUID> findTreeIdsByParentCode(@Param("parentCode") String parentCode);

    @Modifying
    @Query(value = """
            WITH RECURSIVE tree AS (
                SELECT id, code, parent_code FROM sa_permission WHERE code = :parentCode
                UNION ALL
                SELECT p.id, p.code, p.parent_code
                FROM sa_permission p
                JOIN tree t ON p.parent_code = t.code
            )
            DELETE FROM sa_permission WHERE id IN (SELECT id FROM tree)
            """, nativeQuery = true)
    void deleteTreeByParentCode(@Param("parentCode") String parentCode);

    @Modifying
    @Query(value = """
            WITH RECURSIVE tree AS (
                SELECT id, code, parent_code FROM sa_permission WHERE code = :rootCode
                UNION ALL
                SELECT p.id, p.code, p.parent_code
                FROM sa_permission p
                JOIN tree t ON p.parent_code = t.code
            )
            UPDATE sa_permission SET module_code = :moduleCode WHERE id IN (SELECT id FROM tree)
            """, nativeQuery = true)
    void updateModuleCodeByTree(@Param("rootCode") String rootCode, @Param("moduleCode") String moduleCode);

    @Modifying
    @Query(value = """
            WITH RECURSIVE tree AS (
                SELECT r.id, r.code, r.url_segment,
                       (COALESCE(p.url, '') || r.url_segment)::text AS full_url
                FROM sa_permission r
                LEFT JOIN sa_permission p ON r.parent_code = p.code
                WHERE r.code = :rootCode
                  AND r.url_segment IS NOT NULL
                UNION ALL
                SELECT c.id, c.code, c.url_segment,
                       t.full_url || c.url_segment
                FROM sa_permission c
                JOIN tree t ON c.parent_code = t.code
                WHERE c.url_segment IS NOT NULL
            )
            UPDATE sa_permission sp
            SET url = tree.full_url
            FROM tree
            WHERE sp.id = tree.id
            """, nativeQuery = true)
    void refreshUrlByTree(@Param("rootCode") String rootCode);
}
