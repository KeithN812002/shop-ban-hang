# Project Context

Reusable, domain-agnostic backend core. It provides infrastructure modules plus a slim system-administration (`sa`) module (authentication, user, role, menu/permission, email outbox/templates). Business projects add their own `bom-{domain}` / `res-{domain}` modules on top. See `README.md` for the module list and `EXTRACTION_NOTES.md` for what was removed from the original project.

**Navigation**
- Looking for ONE known symbol → `grep` directly.
- Task spans several layers → start from `res-sa` (controllers) → `bom-sa` (services) → `core-*` (shared infra).
- Coding standard with good/bad examples → `CONVENTIONS.md`.

## Stack

- Java 21, Spring Boot 4.1.1, Spring Cloud 2025.1.3, Jackson 3 (`tools.jackson`)
- Multi-module Maven: core-* (infra) + bom-* (business logic) + res-* (controllers)
- PostgreSQL + Spring Data JPA + Specification pattern
- Redis (`CacheService` in core-cache)
- MinIO (`StorageService` in core-storage)
- OAuth2 / JWT (core-security), Keycloak admin/token client (core-keycloak)

## Module Convention

- **core-***: infrastructure, shared across all BOM/RES modules (`core-common`, `core-persistence`, `core-security`, `core-cache`, `core-storage`, `core-keycloak`, `core-email`, `core-server`)
- **bom-{domain}**: entity + repository + service (business logic). Currently `bom-sa`.
- **res-{domain}**: controllers only — depends on bom-{domain} + core-*. Currently `res-sa`.
- Dependency direction: business→business or business→core. `res-*` never depends on another `res-*`; nothing depends on `res-*` except `core-server` (the runnable assembly).
- Never put business logic in controllers (res-*); always in services (bom-*).
- Adding a domain: create `bom-{domain}` + `res-{domain}`, register both in the root `pom.xml` (`modules` + `dependencyManagement`) and add them as dependencies of `core-server`. The application scans `com.fpt.core`, `com.fpt.bom`, `com.fpt.res`.

## Rules (non-negotiable checklist — full detail and examples in `CONVENTIONS.md`)

- Controllers (`res-*`) are THIN — delegate only; all logic in services (`bom-*`).
- All API responses wrapped in `Response<T>`; use `Response.ok(...)`. Never return a raw entity/DTO.
- **Mutations use POST + verb path**: `POST /create`, `POST /update`, `POST /delete` (NOT PUT/DELETE).
- Permission enforced by default; `@SkipPermissionCheck` only for intentionally public endpoints.
- Services: `@Service @RequiredArgsConstructor @Slf4j`; `@Transactional(readOnly=true)` reads / `@Transactional` writes.
- Advanced queries use `SpecificationBuilder` (+ `JpaFieldSpecifications`/`JpaStringSpecifications`) — not raw JPQL unless necessary; paginate via `PageableUtils`, return `PageResult<T>`.
- All business/validation errors → `throw new BaseException(codeOrI18nKey)`. i18n mandatory for user-facing messages (`MessageResolver`). Every key must exist in BOTH `core-common/.../messages.properties` and `messages_en.properties`; run `python scripts/check-i18n.py` after adding/renaming/removing keys (exit 1 = duplicate, vi/en mismatch, empty, missing, or unused key). IntelliJ "Unused property" is NOT reliable here (it cannot see `{key}` in validation annotations or runtime-built keys) — never delete keys based on it. Never concatenate details into the key (`"X: " + id`); pass them as args and use `{0}`.
- Entities extend `EntityBase` (audit). Soft-delete is SELECTIVE: only entities with `isDeleted` → `delete()` sets `isDeleted=true` + reads filter `IsDeletedFalse`; others hard-delete. Check the entity first.
- Config values (DB, Redis, MinIO, SSO) live in Consul, bound to `*Properties` — never hard-code in code/yaml. Never commit secrets.
- Email event types and template modules are plain string codes (see `core-email`); projects define their own constants, they are not enums in core.
- Email template cache eviction: `EmailTemplateServiceImpl.update()` deletes key `email:template:{eventType}` — preserve it on template update (shared with any email worker that reads the same cache).
