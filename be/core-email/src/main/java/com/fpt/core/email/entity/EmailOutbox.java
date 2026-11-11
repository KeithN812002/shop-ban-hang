package com.fpt.core.email.entity;

import com.fpt.core.common.enums.StatusEmailOutbox;
import com.fpt.core.persistence.entity.EntityBase;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Author: hoanglm21@fpt.com
 * Date: 02/06/2026
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "sa_email_outbox")
public class EmailOutbox extends EntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @Column(name = "receiver", columnDefinition = "text", nullable = false)
    private String receiver;

    @Column(name = "subject", length = 500)
    private String subject;

    @Column(name = "body", columnDefinition = "text")
    private String body;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "status", nullable = false)
    private StatusEmailOutbox status;

    @Column(name = "variables", columnDefinition = "text")
    private String variables;

    @Column(name = "retry_count", nullable = false)
    private Integer retryCount = 0;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "error_message", length = 500)
    private String errorMessage;
}
