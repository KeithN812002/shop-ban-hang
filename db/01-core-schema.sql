-- =====================================================================================================
-- 01-core-schema.sql - DDL of the core (sa_*) tables, derived from the JPA entities of bom-sa,
-- core-email and core-persistence (EntityBase / EntitySoftDeleteBase audit columns).
--
-- Enum type names follow the native SQL used by bom-sa (PermissionRepository casts to permission_type,
-- http_method and status_basic). Hibernate binds enum values with setObject(..., Types.OTHER), so the type
-- names only have to exist; they are not read from the entities at runtime.
-- Idempotent: safe to run more than once.
-- =====================================================================================================

DO $$ BEGIN
    CREATE TYPE status_basic AS ENUM ('ACTIVE', 'INACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE permission_type AS ENUM ('ROOT', 'GROUP', 'MENU', 'PAGE', 'FUNCTION', 'API');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE http_method AS ENUM ('GET', 'POST', 'PUT', 'PATCH', 'DELETE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE status_email_outbox AS ENUM ('NEW', 'PENDING', 'PROCESSING', 'SUCCESS', 'FAIL', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Permission codes are TYPE_000123, the number comes from this sequence (PermissionRepository.getNextSequenceId).
CREATE SEQUENCE IF NOT EXISTS sa_permission_seq START WITH 1 INCREMENT BY 1;

-- ---- reference tables (populated by the owning project; the core has no controller for them) ----

CREATE TABLE IF NOT EXISTS sa_gender (
    id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    ext_id       uuid         NOT NULL UNIQUE,
    name         varchar(200) NOT NULL,
    status       status_basic NOT NULL,
    created_date timestamp    NOT NULL DEFAULT now(),
    created_by   varchar(50)  NOT NULL DEFAULT 'system',
    updated_date timestamp    NOT NULL DEFAULT now(),
    updated_by   varchar(50)  NOT NULL DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS sa_unit (
    id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    ext_id       uuid         NOT NULL UNIQUE,
    code         varchar(50),
    name         varchar(200) NOT NULL,
    description  varchar(500),
    status       status_basic NOT NULL,
    created_date timestamp    NOT NULL DEFAULT now(),
    created_by   varchar(50)  NOT NULL DEFAULT 'system',
    updated_date timestamp    NOT NULL DEFAULT now(),
    updated_by   varchar(50)  NOT NULL DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS sa_department (
    id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    ext_id       uuid         NOT NULL UNIQUE,
    name         varchar(200) NOT NULL,
    description  varchar(500),
    unit_id      uuid,
    status       status_basic NOT NULL,
    created_date timestamp    NOT NULL DEFAULT now(),
    created_by   varchar(50)  NOT NULL DEFAULT 'system',
    updated_date timestamp    NOT NULL DEFAULT now(),
    updated_by   varchar(50)  NOT NULL DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS sa_position (
    id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    ext_id       uuid         NOT NULL UNIQUE,
    name         varchar(200) NOT NULL,
    description  varchar(500),
    status       status_basic NOT NULL,
    created_date timestamp    NOT NULL DEFAULT now(),
    created_by   varchar(50)  NOT NULL DEFAULT 'system',
    updated_date timestamp    NOT NULL DEFAULT now(),
    updated_by   varchar(50)  NOT NULL DEFAULT 'system'
);

-- ---- users, roles, permissions ----

CREATE TABLE IF NOT EXISTS sa_user (
    id                 uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    ext_id             uuid,                              -- Keycloak user id
    user_name          varchar(50)  NOT NULL UNIQUE,      -- Keycloak preferred_username
    personal_name      varchar(200) NOT NULL,
    email              varchar(100),
    gender_id          uuid,
    unit_id            uuid,
    position_id        uuid,
    department_id      uuid,
    external_unit_code varchar(50),
    is_internal        boolean      NOT NULL,
    app_code           varchar(20)  NOT NULL,             -- 'CORE' (AppEnum.CORE_APP)
    roles              text[],                            -- role codes (sa_role.code); there is no user-role table
    status             status_basic NOT NULL,
    is_deleted         boolean      NOT NULL DEFAULT false,
    deleted_date       timestamp,
    deleted_by         varchar(50),
    created_date       timestamp    NOT NULL DEFAULT now(),
    created_by         varchar(50)  NOT NULL DEFAULT 'system',
    updated_date       timestamp    NOT NULL DEFAULT now(),
    updated_by         varchar(50)  NOT NULL DEFAULT 'system'
);
CREATE INDEX IF NOT EXISTS idx_sa_user_created ON sa_user (created_date);
CREATE INDEX IF NOT EXISTS idx_sa_user_scope ON sa_user (is_internal, is_deleted, status);

CREATE TABLE IF NOT EXISTS sa_role (
    id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    code         varchar(20)  NOT NULL UNIQUE,
    name         varchar(200) NOT NULL UNIQUE,
    app_code     varchar(20)  NOT NULL,
    status       status_basic NOT NULL,
    created_date timestamp    NOT NULL DEFAULT now(),
    created_by   varchar(50)  NOT NULL DEFAULT 'system',
    updated_date timestamp    NOT NULL DEFAULT now(),
    updated_by   varchar(50)  NOT NULL DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS sa_permission (
    id           uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
    code         varchar(20)     NOT NULL UNIQUE,
    name         varchar(200)    NOT NULL,
    foreign_name varchar(200),
    parent_code  varchar(50),
    app_code     varchar(20)     NOT NULL,
    module_code  varchar(20)     NOT NULL,
    type         permission_type NOT NULL,
    url          varchar(500),
    url_segment  varchar(200),
    path_folder  varchar(500),
    uri          varchar(500),
    method       http_method,
    button_action varchar(50),
    icon         varchar(100),
    sort_order   integer,
    description  varchar(500),
    status       status_basic    NOT NULL,
    created_date timestamp       NOT NULL DEFAULT now(),
    created_by   varchar(50)     NOT NULL DEFAULT 'system',
    updated_date timestamp       NOT NULL DEFAULT now(),
    updated_by   varchar(50)     NOT NULL DEFAULT 'system'
);
CREATE INDEX IF NOT EXISTS idx_sa_permission_parent ON sa_permission (parent_code);

CREATE TABLE IF NOT EXISTS sa_role_permission (
    id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id       uuid         NOT NULL REFERENCES sa_role (id),
    permission_id uuid         NOT NULL REFERENCES sa_permission (id),
    app_code      varchar(20)  NOT NULL,
    status        status_basic NOT NULL,
    created_date  timestamp    NOT NULL DEFAULT now(),
    created_by    varchar(50)  NOT NULL DEFAULT 'system',
    updated_date  timestamp    NOT NULL DEFAULT now(),
    updated_by    varchar(50)  NOT NULL DEFAULT 'system',
    CONSTRAINT uk_sa_role_permission_role_perm UNIQUE (role_id, permission_id)
);

-- ---- core-email ----

CREATE TABLE IF NOT EXISTS sa_email_outbox (
    id            uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type    varchar(100)        NOT NULL,
    receiver      text                NOT NULL,
    subject       varchar(500),
    body          text,
    status        status_email_outbox NOT NULL,
    variables     text,
    retry_count   integer             NOT NULL DEFAULT 0,
    sent_at       timestamp,
    error_message varchar(500),
    created_date  timestamp           NOT NULL DEFAULT now(),
    created_by    varchar(50)         NOT NULL DEFAULT 'system',
    updated_date  timestamp           NOT NULL DEFAULT now(),
    updated_by    varchar(50)         NOT NULL DEFAULT 'system'
);
CREATE INDEX IF NOT EXISTS idx_sa_email_outbox_status ON sa_email_outbox (status, created_date);

CREATE TABLE IF NOT EXISTS sa_email_template (
    id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type       varchar(100) NOT NULL UNIQUE,
    module           varchar(50)  NOT NULL,
    subject_template varchar(500) NOT NULL,
    body_template    text,
    variables        text[],
    status           status_basic NOT NULL DEFAULT 'ACTIVE',
    created_date     timestamp    NOT NULL DEFAULT now(),
    created_by       varchar(50)  NOT NULL DEFAULT 'system',
    updated_date     timestamp    NOT NULL DEFAULT now(),
    updated_by       varchar(50)  NOT NULL DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS sa_email_template_variable (
    id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    code         varchar(50)  NOT NULL UNIQUE,
    label        varchar(200) NOT NULL,
    created_date timestamp    NOT NULL DEFAULT now(),
    created_by   varchar(50)  NOT NULL DEFAULT 'system',
    updated_date timestamp    NOT NULL DEFAULT now(),
    updated_by   varchar(50)  NOT NULL DEFAULT 'system'
);
