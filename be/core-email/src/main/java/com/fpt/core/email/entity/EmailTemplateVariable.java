package com.fpt.core.email.entity;

import com.fpt.core.persistence.entity.EntityBase;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Human-readable label dictionary for the variables ({code}) a template may use.
 */
@Getter
@Setter
@EqualsAndHashCode(callSuper = true)
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "sa_email_template_variable")
public class EmailTemplateVariable extends EntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "code", nullable = false, updatable = false, length = 50, unique = true)
    private String code;

    @Column(name = "label", nullable = false, length = 200)
    private String label;
}
