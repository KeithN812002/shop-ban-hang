package com.fpt.core.email.entity;

import com.fpt.core.common.enums.StatusBasic;
import com.fpt.core.persistence.entity.EntityBase;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

/**
 * Author: hoanglm21@fpt.com
 * Date: 03/06/2026
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "sa_email_template")
public class EmailTemplate extends EntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "event_type", nullable = false, unique = true, length = 100)
    private String eventType;

    @Column(name = "module", nullable = false, updatable = false, length = 50)
    private String module;

    @Column(name = "subject_template", length = 500, nullable = false)
    private String subjectTemplate;

    @Column(name = "body_template", columnDefinition = "text")
    private String bodyTemplate;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "variables", columnDefinition = "text[]")
    private String[] variables;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "status", nullable = false)
    private StatusBasic status = StatusBasic.ACTIVE;
}
