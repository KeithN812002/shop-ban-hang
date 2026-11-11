# Core Backend

Reusable, domain-agnostic Spring Boot backend core (Java 21, Spring Boot 4.1.1, Spring Cloud 2025.1.3, Maven multi-module). It ships the infrastructure every service needs plus a slim system-administration module. Business projects build on top of it by adding their own `bom-{domain}` / `res-{domain}` modules.

See `EXTRACTION_NOTES.md` for the exact scope, the retained API endpoints, and what was dropped when the core was extracted.

## Installation

### 1. Prerequisites

| Tool / service | Version | Used for |
| -------------- | ------- | -------- |
| JDK | 21 | Build and run |
| Maven | 3.6+ | Build |
| PostgreSQL | any supported by driver 42.7.x | Application database |
| Redis | standalone or cluster | Cache, token blacklist, OTP |
| Keycloak | — | Login (authorization code, refresh, password grants) and user administration |
| Consul | — | All runtime configuration (KV store) |
| MinIO | — | File storage (`core-storage`) |

For a local setup you can start the services with Docker. These commands are examples; pin the image versions your team uses:

```bash
docker run -d --name core-postgres -p 5432:5432 -e POSTGRES_DB=core -e POSTGRES_USER=core -e POSTGRES_PASSWORD=<db-password> postgres
docker run -d --name core-redis    -p 6379:6379 redis
docker run -d --name core-consul   -p 8500:8500 hashicorp/consul agent -dev -client=0.0.0.0
docker run -d --name core-keycloak -p 8080:8080 -e KC_BOOTSTRAP_ADMIN_USERNAME=admin -e KC_BOOTSTRAP_ADMIN_PASSWORD=<admin-password> quay.io/keycloak/keycloak start-dev
docker run -d --name core-minio    -p 9000:9000 -p 9001:9001 -e MINIO_ROOT_USER=<access-key> -e MINIO_ROOT_PASSWORD=<secret-key> minio/minio server /data --console-address :9001
```

### 2. Database schema

The repository has no DDL or migration scripts, and no `ddl-auto` setting. Create the schema for the `sa_*` tables (and `sa_email_*` from `core-email`) before the first run, from your project's migration tool or an existing database. Menus and screens only appear after `sa_permission` rows exist and are granted to a role. See `EXTRACTION_NOTES.md` for schema differences from the source project.

### 3. Keycloak

Create a realm and one **confidential** client for the backend:

- Client authentication: on (the backend sends `client_id` + `client_secret`).
- Flows: Standard flow (authorization code), Direct access grants (password), Service accounts (client credentials).
- Valid redirect URIs: the frontend callback URL (`FIS_REDIRECT_URL` in `fe/apps/web/.env`).
- Service account roles (`realm-management`): `manage-users`, `view-users`, and `manage-realm`. The backend creates, updates, deletes and resets passwords of users and reads/updates realm settings (password policy).

### 4. Consul configuration

`application.yml` only points to Consul (`127.0.0.1:8500`) and sets `spring.application.name: core-app`. Everything else comes from the Consul KV store, in YAML under the key `data`. With Spring Cloud Consul defaults the keys are:

- `config/core-app/data` — shared values
- `config/core-app,local/data` — values for the `local` profile

Template (replace every `<...>`; never commit real values):

```yaml
server:
  port: 8200

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/core
    username: <db-user>
    password: <db-password>
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://localhost:8080/realms/<realm>

redis:
  active-cluster: false          # true = cluster mode using redis.config.nodes
  host: localhost
  port: 6379
  client-secret: ""              # Redis password; must be present, may be empty
  default-expire: "60"           # default cache TTL (default 60)
  default-time-unit: SECONDS     # MILLISECONDS | SECONDS | MINUTES | HOURS | DAYS
  config:
    nodes: [ "localhost:6379" ]  # required (validated) even in standalone mode

keycloak:
  auth-server-url: http://localhost:8080
  realm: <realm>
  resource:
    app: <client-id>
  credentials:
    secret: <client-secret>

minio:
  host-url: http://localhost:9000
  access-name: <access-key>
  access-secret: <secret-key>

app:
  app-name: Core Application
  login-url: http://localhost:8088
  email:
    crypto:
      key: <aes-key>             # AES key: 16, 24 or 32 ASCII characters
  otp:
    change-password-expire-minutes: 5
    change-password-cooldown-minutes: 1

security:
  white-list:                    # paths reachable without a token
    - /sa/auth/exchange-auth-code
    - /sa/auth/refresh-token
    - /swagger-ui/**
    - /v3/api-docs/**
    - /actuator/health
  skip-all-permissions: false

app.logging:
  use-json-format: false
  logstash:
    enabled: false
```

Load it with the Consul UI (`http://localhost:8500` → Key/Value) or the CLI:

```bash
consul kv put config/core-app,local/data @consul-local.yml
```

## Running

```bash
mvn clean install -DskipTests                                           # build all modules
mvn spring-boot:run -pl core-server -Dspring-boot.run.profiles=local    # run from source
```

Or run the packaged jar:

```bash
java -jar core-server/target/core-server-0.0.1-SNAPSHOT.jar --spring.profiles.active=local
```

To use a Consul agent that is not on `127.0.0.1:8500`, pass `--spring.cloud.consul.host=<host> --spring.cloud.consul.port=<port>`.

Logs are written to `./app_log` and `./app_log_debug`; override the base folder with the `LOG_DIR` environment variable.

### Verify after startup

- Swagger UI: `http://localhost:8200/swagger-ui.html`
- OpenAPI: `http://localhost:8200/v3/api-docs`
- Health: `http://localhost:8200/actuator/health`

(Port `8200` is the `server.port` value from the Consul template above.)

## Modules

### Core modules
- **core-server**: Spring Boot application, centralized exception handling, logging, async, OpenAPI
- **core-common**: constants, DTOs, enums, utilities, `Response` wrapper, i18n resources
- **core-persistence**: base entities, JPA specification builders, paging helpers
- **core-security**: resource-server security, permission filter, `SecurityUtils`, AES helper
- **core-keycloak**: Keycloak token / user administration client
- **core-cache**: Redis cache abstraction
- **core-storage**: MinIO storage service
- **core-email**: email outbox and email templates (event types and module codes are string codes)

### Business modules
- **bom-sa**: entities, repositories, services, DTOs for authentication, user, role, menu/permission
- **res-sa**: REST controllers for the above plus email outbox/template administration
- **bom-shop** / **res-shop**: e-commerce shop (catalogue, cart, orders, seller/shipper/admin, chatbot). Contract: `../docs/shop-contract.md`; schema and seed: `../db/README.md`

Dependency direction: `res-*` → `bom-*` → `core-*`. `core-server` assembles everything.

## Technology Stack

- Java 21, Spring Boot 4.1.1, Spring Cloud 2025.1.3, Spring Data JPA / Hibernate, Maven
- PostgreSQL, Redis, MinIO, Consul
- OpenID Connect / OAuth2 / JWT, Spring Security, Keycloak
- OpenAPI 3.0 (SpringDoc), Logback + Logstash encoder, Spring Actuator

## Build & Run

```bash
mvn clean install                       # build all modules
mvn clean install -DskipTests           # build without tests
mvn clean install -pl core-server -am   # build one module and what it needs
```

## Extending the core with a new domain

1. Create `bom-{domain}` (entity, repository, service, dto) and `res-{domain}` (controllers).
2. Register both in the root `pom.xml` (`<modules>` and `<dependencyManagement>`), and add them to `core-server/pom.xml` dependencies.
3. Keep packages under `com.fpt.bom.{domain}` / `com.fpt.res.{domain}` — the application scans `com.fpt.core`, `com.fpt.bom`, `com.fpt.res`.
4. Follow `CONVENTIONS.md`. Add error/validation keys to both message bundles.
5. For emails, define your own event-type string codes and seed matching rows in `sa_email_template` (and optionally labels in `sa_email_template_variable`).

## Backend Conventions (summary)

- **Controller**: request/response orchestration only, no business logic.
- **Service**: all business logic, `@Transactional`.
- **Repository**: data access only.
- **Entity**: extends `EntityBase` (audit fields); columns in `snake_case`.
- **Response**: always `Response<T>`; search DTOs extend `PagingBase`; validation via Bean Validation.
- **Errors**: `BaseException(code, args...)`; messages in `core-common/src/main/resources/messages.properties` (Vietnamese, default) and `messages_en.properties`.

Full details: `CONVENTIONS.md`.

## Core Utility Guide

- `SecurityUtils.getCurrentUsername()` — username of the current session. `createdBy`/`updatedBy` are filled by `SpringSecurityAuditorAware`.
- `StorageService` (core-storage) — `putObject`, `getObject`, `removeObject`.
- `CacheService` (core-cache) — `setString(key, value, expire)`, `getString(key)`, `delete(key)`.

## Configuration Security

Operational configuration and secrets (DB password, Keycloak client secret, MinIO keys, AES key) live in Consul and are bound to `*Properties` classes. The repository holds no real values; never commit them. Restrict access to the Consul KV path of each environment.

## Repository Structure

```text
be/
├── core-cache/         # Redis abstraction
├── core-common/        # Shared DTOs, enums, utils, i18n
├── core-email/         # Email outbox + templates
├── core-keycloak/      # Keycloak client
├── core-persistence/   # Base entities, JPA specs, paging
├── core-security/      # Security config, SecurityUtils
├── core-server/        # Main app, global exception handlers
├── core-storage/       # MinIO storage service
├── bom-sa/             # System administration: logic
├── res-sa/             # System administration: controllers
├── scripts/            # check-i18n.py
└── pom.xml             # Parent POM (core-parent)
```

## Version
`0.0.1-SNAPSHOT`
