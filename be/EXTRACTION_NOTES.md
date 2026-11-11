# Extraction Notes

This backend was copied from the original project and reduced to a domain-agnostic core. Java packages (`com.fpt.core`, `com.fpt.bom`, `com.fpt.res`) and the Maven `groupId` (`com.fpt`) are unchanged; the parent `artifactId` is now `core-parent`.

## Remaining modules

`core-common`, `core-persistence`, `core-security`, `core-cache`, `core-storage`, `core-keycloak`, `core-email`, `core-server`, `bom-sa`, `res-sa`.

## Removed

Modules (not present in this tree): `core-thirdparty`, `bom-catalog`/`res-catalog` (catalog is project-domain: category sync, national-area mapping, external units, case types), `bom-share`, `bom-cpa`/`res-cpa`, `bom-consular`/`res-consular`, `bom-report`/`res-report`, `bom-data-share`/`res-data-share`, `bom-citizen-profile`/`res-citizen-profile`.

core-common
- `constant/DataShare*` (4 files), `properties/MofaApiProperties`.
- All domain enums; kept only `AppEnum`, `ErrorEnum`, `LanguageEnum`, `MethodEnum`, `PermissionEnum`, `StatusBasic`, `StatusCatalog`, `StatusEmailOutbox`, `TimeEnum`. Also removed `ConfigKeyEnum`/`ConfigGroupEnum`, `ClientSystemEnum`, unit-type enums, `ProcessingTimeUnit`, `EmailOutboxEventType`, `EmailTemplateModule`, `TemplateVariableScope`.
- DTOs: `TemplateVariableResponse`, `ExtOptionFullResponse`, `FullOptionResponse`, `DashboardFilterRequest`, `DayCountProjection`, `KeyCountProjection`, `SlaAlertProjection`.
- `util/ForeignerKeyUtils`.
- `Constants`: removed `DOCUMENT_TEMPLATE`, `CASE_REPLY`, `BUSINESS`, `GEO`, `CATEGORY`, `PROCESSING_TIME`, `APP_NAME`, and the domain MinIO bucket names. `UserCacheKeys.provinceCode` removed.
- `AppSsoProperties`: removed `consularUnitName`, `hcmUnitName`.
- `messages.properties` / `messages_en.properties`: 762 -> 136 keys (every key reported unused by `scripts/check-i18n.py` was removed; the script now reports 0 issues).

core-persistence: `entity/TemplateVariable`, `repository/TemplateVariableRepository` (replaced by an email-only dictionary in core-email, see below).

core-security: `SecurityUtils.getCurrentProvinceCode`.

core-email: dashboard queries in `EmailOutboxRepository` (`KeyCountProjection`/`DayCountProjection` consumers).

core-server: `DataShareAuthorizationInterceptor` and its registration in `MyWebMvcConfigurer`, `MofaApiProperties` from `ApiApplication`, the two xlsx import templates, the stray `_bak.jar`, and all dependencies on removed modules.

bom-sa / res-sa
- Drop list from the brief: configAreaUser, configOrgProvince, unitRepresentative, processingTime, shareApi, clientSystemPermission / client API key, dashboard (service + SLA support classes), eventMessage.
- Also removed: system `Config` (key/value config, system and citizen-protection settings, password-policy admin endpoints under `/sa/config`), `Unit`/`Department`/`Position`/`Gender` controllers, services and sync code (MOFA directory sync), `InternalUser` org-user lookup and sync (`/org-users`, `/sync`), document-template, duplicate-config and file-storage controllers (they depended on `bom-share`), `dto/common` sync DTOs, support classes `ExtIdSyncSupport`, `OrgMailRouting`, `SourcePager`, `SyncDiff`, `UnitNameLookup`, `ProcessUnits`, `Sla*`, `DashboardPeriod`.
- External-user validation against the catalog `ExternalUnit` and the `ExternalUnitTypeEnum` user-name prefix rule.

## Made generic

- core-email: `eventType` (outbox + template) and template `module` are now plain strings (`varchar`, previously Postgres named enums). `EmailTemplateModuleSupport.resolveModule` validates `[A-Za-z0-9_-]{1,50}` and upper-cases it instead of a fixed SA/CPA/CONSULAR map. Added a label dictionary entity (`EmailTemplateVariable`, table `sa_email_template_variable`) in core-email and `TemplateVariableResponse` DTO in `core-email` (same JSON shape: `code`, `label`). The label dictionary table is new; the old `sa_template_variable` is no longer mapped.
- bom-sa: email event type codes live in `com.fpt.bom.sa.constant.EmailEvents` (`CREATE_USER`, `UPDATE_USER`, `RESET_PASSWORD`, `OTP_CHANGE_PASSWORD`).
- `AppSsoProperties.appName` (config key `app.app-name`, default `Core Application`) replaces the hard-coded application name used in emails.
- `AppEnum.CORE_APP` code is now `CORE` (was a project-specific code). This value is stored in `app_code` columns; existing data created with the old code will not match.
- `Unit`, `Department`, `Position`, `Gender` are kept as minimal reference entities (id, extId, name, status, ...) used only to resolve display names for users. The core has no controller or sync for them; the owning project populates the tables.
- `User` keeps `unitId`, `departmentId`, `positionId`, `genderId`, `externalUnitCode` as plain references; `externalUnitCode` is now just an organization code of an external user with no catalog validation.

## Response shape changes (called out because the brief asked for unchanged shapes)

- `GET /sa/auth/me` (`MeResponse`): `provinceCode` removed (geographic domain concept).
- External user DTOs (`ExternalUserResponse`, `ExternalUserDetailResponse`, `ExternalUserFilterRequest`, `ExternalUserCreateRequest`): `externalUnitType` removed; `ExternalUserResponse.externalUnitName` removed.
- Internal user DTOs unchanged in shape; `unitName`/`departmentName`/`positionName`/`genderName` are resolved from the minimal reference tables and are null when those tables are empty.
- Email template/outbox responses: `eventType` is serialized as a string (same JSON value as before for existing codes).
- Message keys removed from the bundles (any key not referenced by the remaining code).

## Retained SA endpoints

Authentication (`/sa/auth`)
- POST `/sa/auth/exchange-auth-code` (form-urlencoded)
- POST `/sa/auth/refresh-token`
- GET `/sa/auth/me`
- POST `/sa/auth/request-otp`
- POST `/sa/auth/resend-otp`
- POST `/sa/auth/confirm-change-password`
- GET `/sa/auth/password-policy`
- POST `/sa/auth/logout`

Internal user (`/sa/internal-user`)
- GET `/options`, GET `/search`, GET `/{id}`
- POST `/assign-roles`, `/active`, `/inactive`, `/delete`, `/active-bulk`, `/inactive-bulk`, `/delete-bulk`

External user (`/sa/external-user`)
- GET `/options`, GET `/search`, GET `/{id}`
- POST `/create`, `/update`, `/active`, `/inactive`, `/delete`, `/active-bulk`, `/inactive-bulk`, `/delete-bulk`, `/reset-password`, `/reset-password-bulk`

Role (`/sa/role`)
- GET `/options`, GET `/search`, GET `/{id}`
- POST `/create`, `/update`, `/delete`, `/active`, `/inactive`, `/active-bulk`, `/inactive-bulk`, `/delete-bulk`

Menu / permission (`/sa/permission`; menus are permissions of type ROOT/GROUP/MENU/PAGE/FUNCTION/API)
- GET `/all-active-for-role`, GET `/all`, GET `/{id}`
- POST `/create`, `/update`, `/delete`
- GET `/export`
- POST `/import/preview`, `/import/apply` (multipart)

Email administration (`core-email`, hosted in `res-sa`)
- GET `/sa/email-outbox/search`, GET `/sa/email-outbox/{id}`, POST `/sa/email-outbox/resend`, `/sa/email-outbox/resend-bulk`
- GET `/sa/email-template/{type}/search`, GET `/sa/email-template/{type}/{id}`, POST `/sa/email-template/{type}/update`, `/active`, `/inactive`, `/active-bulk`, `/inactive-bulk` (`{type}` is the template module code)

The runtime permission check used by `CustomAuthorizationFilter` / `PermissionAspect` is fed by `AuthenticationServiceImpl` (implements `UserPermissionProvider`, caches the user's backend permissions and unit under `user:{username}:*`).

## Build

Command (run from this directory; `mvn` was not on PATH, so the IntelliJ-bundled Maven was used):

```
"C:/Program Files/JetBrains/IntelliJ IDEA 2025.3.1/plugins/maven/lib/maven3/bin/mvn.cmd" -q -DskipTests clean compile
"C:/Program Files/JetBrains/IntelliJ IDEA 2025.3.1/plugins/maven/lib/maven3/bin/mvn.cmd" -DskipTests package
```

Result: BUILD SUCCESS for all 11 reactor projects (core-parent, core-common, core-cache, core-keycloak, core-security, core-persistence, core-email, bom-sa, res-sa, core-server, core-storage); `core-server/target/core-server-0.0.1-SNAPSHOT.jar` produced. Tests were skipped (the tree contains none). The application was not started (needs PostgreSQL, Redis, Keycloak, Consul). `python scripts/check-i18n.py` reports 0 issues (136 keys in each bundle).

## Open points

- Schema: `sa_email_outbox.event_type`, `sa_email_template.event_type` and `.module` are now varchar instead of Postgres enum types; `sa_email_template_variable` is a new table; `sa_unit`, `sa_department`, `sa_position` lost columns from the original entities. The repository has no DDL scripts, so schema migration is the adopting project's responsibility.
- `core-storage` is built but nothing in the core depends on it (the controller that used it lived in a removed module).
- `ExcelTemplateEngine` (core-common, Apache POI) is kept as a generic utility although the core has no caller.
