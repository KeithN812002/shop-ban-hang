package com.fpt.bom.sa.entity;

import com.fpt.core.persistence.entity.EntityBase;
import com.fpt.core.common.enums.StatusBasic;
import com.fpt.core.common.enums.MethodEnum;
import com.fpt.core.common.enums.PermissionEnum;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

/**
 * Author: hoanglm21@fpt.com
 * Date: 1/1/26
 */
@Getter
@Setter
@EqualsAndHashCode(callSuper = true)
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "sa_permission")
public class Permission extends EntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "code", length = 20, nullable = false, unique = true)
    private String code;

    @Column(name = "name", length = 200, nullable = false)
    private String name;

    @Column(name = "foreign_name", length = 200)
    private String foreignName;

    @Column(name = "parent_code", length = 50)
    private String parentCode;

    @Column(name = "app_code", length = 20, nullable = false)
    private String appCode;

    @Column(name = "module_code", length = 20, nullable = false)
    private String moduleCode;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "type", nullable = false)
    private PermissionEnum type;

    @Column(name = "url", length = 500)
    private String url;

    @Column(name = "url_segment", length = 200)
    private String urlSegment;

    @Column(name = "path_folder", length = 500)
    private String pathFolder;

    @Column(name = "uri", length = 500)
    private String uri;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "method")
    private MethodEnum method;

    @Column(name = "button_action", length = 50)
    private String buttonAction;

    @Column(name = "icon", length = 100)
    private String icon;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Column(name = "description", length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "status", nullable = false)
    private StatusBasic status;
}
