package com.fpt.bom.sa.entity;

import com.fpt.core.common.enums.StatusBasic;
import com.fpt.core.persistence.entity.EntityBase;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

/**
 * Minimal organization-unit reference. Used only to resolve unit names for users;
 * the owning project is responsible for populating it.
 */
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "sa_unit")
public class Unit extends EntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "ext_id", unique = true, nullable = false)
    private UUID extId;

    @Column(name = "code", length = 50)
    private String code;

    @Column(name = "name", length = 200, nullable = false)
    private String name;

    @Column(name = "description", length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "status", nullable = false)
    private StatusBasic status;
}
