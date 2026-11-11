package com.fpt.bom.sa.entity;

import com.fpt.core.persistence.entity.EntitySoftDeleteBase;
import com.fpt.core.common.enums.StatusBasic;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;
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
@Table(name = "sa_user")
public class User extends EntitySoftDeleteBase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "ext_id", columnDefinition = "uuid")
    private UUID extId;

    @Column(name = "user_name", length = 50, nullable = false, unique = true)
    private String userName;

    @Column(name = "personal_name", length = 200, nullable = false)
    private String personalName;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "gender_id", columnDefinition = "uuid")
    private UUID genderId;

    @Column(name = "unit_id", columnDefinition = "uuid")
    private UUID unitId;

    @Column(name = "position_id", columnDefinition = "uuid")
    private UUID positionId;

    @Column(name = "department_id", columnDefinition = "uuid")
    private UUID departmentId;


    @Column(name = "external_unit_code", length = 50)
    private String externalUnitCode;

    @Column(name = "is_internal", nullable = false)
    private Boolean isInternal;

    @Column(name = "app_code", length = 20, nullable = false)
    private String appCode;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "roles", columnDefinition = "text[]")
    private List<String> roles;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "status", nullable = false)
    private StatusBasic status;
}