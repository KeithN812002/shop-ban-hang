package com.fpt.bom.sa.entity;

import com.fpt.core.persistence.entity.EntityBase;
import com.fpt.core.common.enums.StatusBasic;
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
@Table(name = "sa_role")
public class Role extends EntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "code", length = 20, nullable = false, unique = true)
    private String code;

    @Column(name = "name", length = 200, nullable = false, unique = true)
    private String name;

    @Column(name = "app_code", length = 20, nullable = false)
    private String appCode;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "status", nullable = false)
    private StatusBasic status;
}