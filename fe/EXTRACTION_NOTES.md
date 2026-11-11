# Extraction notes

How `core/fe` was derived from the source frontend (a business application) and how to extend it. The source repository was only read, never modified.

## Retained screens (`apps/web/src/pages/SystemAdministration`)

| Screen          | Backend paths                                                  | Notes                                                                                                                                     |
| --------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `InternalUser`  | `sa/internal-user/*`, `sa/role/options`                        | Search, view, assign roles, activate/inactivate/delete (single and bulk). Org-sync dialog and unit/department/position/gender removed.   |
| `ExternalUser`  | `sa/external-user/*`, `sa/role/options`                        | CRUD + roles. `externalUnitType` and gender removed; `externalUnitCode` is a plain text input/filter.                                    |
| `Role`          | `sa/role/*`                                                    | Unchanged.                                                                                                                                |
| `Permission`    | `sa/permission/*`                                              | Menu/permission tree (ROOT/GROUP/MENU/PAGE/FUNCTION/API), export/import. Unchanged.                                                       |
| `EmailOutbox`   | `sa/email-outbox/*`                                            | Event types reduced to the system ones (`RESET_PASSWORD`, `CREATE_USER`, `OTP_CHANGE_PASSWORD`, `UPDATE_USER`).                           |
| `EmailTemplate` | `sa/email-template/{type}/*`                                   | `{type}` is only `sa` in the core (see `EmailTemplate/utils/emailTemplateScope.ts`).                                                      |

Auth/menu/permission services are untouched: `sa/auth/*` (`exchange-auth-code`, `refresh-token`, `me`, `permissions`, `request-otp`, `resend-otp`, `confirm-change-password`, `password-policy`, `logout`) and menu data derived from the user's permissions.

## Removed

- Domain page groups: `Catalog`, `CitizenProfile`, `CitizenProtectionAbroad`, `Consular`, `Report`.
- SA screens tied to the domain: `CitizenProtectionConfig`, `ClientApiPermission`, `ConsularProcessingUnit`, `Dashboard`, `Department`, `DocumentTemplate`, `DuplicateDetection`, `Gender`, `MigrationUnitConfig`, `PasswordPolicy`, `Position`, `ProcessingTimeConfig`, `ProtectionArea`, `ProtectionProcessingUnit`, `ShareApi`, `SystemConfig`, `Unit`.
- `pages/Common`: domain options (case status, history actions, unit types, scopes, ...), lookup services (catalog, units, case types, sync), file upload service, consular history utils. Kept parts moved to core locations (below).
- `components/Dashboard/*` (chart/KPI widgets used only by the domain dashboards), `components/Common/{SyncPreviewDialog,CollapsibleSectionHeader}`, `types/sync.types.ts`, `shared/components/UserProfile.tsx` (unused).
- Static demo menu: `data/menu.json`, `services/menu/menu-storage.service.ts`, `services/menu/menu.mock.ts` (replaced by `services/menu/menu.service.ts`, which reads menu data from the user's permissions only).
- Header announcement ticker fetch (`sa/event-message/today-messages`, not part of the core backend). The `NewsTicker` UI component is still in `@workspace/ui`; re-add the fetch in `DashboardLayout` if a project provides the endpoint.
- Domain locale namespaces (everything except `permission`, `dynamicRoute`, `role`, `user`, `email-outbox`, `email-template`), the `home`/`config` blocks, domain error codes and `common.*` keys used only by removed screens.
- `packages/ui`: domain skeletons (`PageLoadingType` now: `table-list`, `table-list-actions`, `table-only`, `panel`, `permission`, `sidebar-table`). `LocalFileUploader` fallback labels now use `common.uploader.*`.
- `lib/storage.ts`: duplicate/SLA alert-mute helpers. `utils/menu.utils.ts`: case/foreigner/verification-specific `{mode}` page titles.
- Unused dependencies in `apps/web`: `@tanstack/react-form`, `@tanstack/react-virtual`, `d3-geo`, `react-simple-maps`, `topojson-client`, `docx-preview`, `jszip`, `xlsx`, `@types/d3-geo`, `@types/react-simple-maps`, `world-atlas` (plus the matching `@types/d3-geo` and `d3-color@<3` overrides at the root).
- Branding: `public/images/{logo,favicon}.svg` replaced by neutral placeholders (same file names, so code paths still work), `trongdong.png` and the domain module-pattern SVGs deleted, `index.html` title/description, nginx/k8s hosts, IPs, realm/client ids and app code replaced by placeholders, `/tkdt/` and `/nso/` base paths replaced by `/`.

## Moved / renamed

- `apps/bss-services` -> `apps/web` (package name `web`); root package `core-fe`. `pnpm-lock.yaml` regenerated. k8s resource names, `scripts/*`, `vite.config.js` comments updated; the Dockerfile had no app-folder reference.
- `pages/Common/options/{status,http-method,button-type,icon,permission-type,authorization-status}-options` -> `src/constants/options/` (import `@/constants/options`; includes `PermissionTypeEnum`, which `usePermission`, `usePermissionAction`, providers and routes now use).
- Email outbox status/event-type options -> `src/constants/options/email-outbox-*.ts`.
- `pages/Common/permission/*` (icon picker, parent options) -> `src/shared/permission/` (import `@/shared/permission`).
- `pages/Common/services/lookup` -> `src/services/lookup` (role options only).

## Decoupling points and how projects extend them

All in `apps/web/src/config/`; `main.tsx` imports `registerModules.ts`, the single place a project edits.

1. **Module dashboards** (`moduleRegistry.ts`, replaces the hard-coded `MODULE_DASHBOARDS` in `routes/$.tsx`). Empty by default.

    ```ts
    registerModuleDashboard('/orders', { component: lazy(() => import('@/pages/Orders/Dashboard')), fallbackTitle: 'Orders' })
    ```

2. **Sidebar menu badges** (`menuBadgeRegistry.ts`, replaces the Consular/CPA SLA and merge badge hooks in `DashboardLayout`). Providers are hooks `(menuTree) => { [normalizedPathFolder]: { count, className } }`, merged by `useMenuBadges`. Register before the first render; do not add providers later.

    ```ts
    registerMenuBadgeProvider(menuTree => useOrderBadges(menuTree))
    ```

3. **i18n namespaces**: add `locales/{domain}/{vi,en}.json` and register them in `i18n/locales/index.ts`.
4. **Email events/templates**: extend `constants/options/email-outbox-event-type-options.ts`, `EmailTemplateModuleEnum` and `EmailTemplate/utils/emailTemplateScope.ts`.
5. **Module card look** on `/modules`: colour map in `routes/modules.tsx`, pattern map in `components/Common/ModuleCardPattern.tsx` (`public/images/module-patterns/`).
6. **Menu icon per app code**: `getAppIcon` in `utils/menu.utils.ts`.
7. **Menu/screen reachability** is backend data (menu entry + permission whose `pathFolder` is the folder under `src/pages`), not frontend code.

## Alignment with the backend core (`core/be`)

- `MeResponse.provinceCode` removed -> removed from `UserInfo`; the FE no longer reads unit/position/department/gender/external-unit fields from the user info either.
- External user DTOs lost `externalUnitType` and `externalUnitName`; `externalUnitCode` is a plain string with no catalog lookup -> screen uses a text field; the old user-name prefix rule is gone.
- Removed endpoints no longer called: `sa/internal-user/org-users` and `sa/internal-user/sync`, `sa/config/*`, unit/department/position/gender management, document-template, duplicate-config, file storage, and all `/catalog/*` APIs. Catalog-backed selects were removed (or replaced by plain inputs where a retained screen needed them).
- `ExternalUserCreateRequest`/`UpdateRequest.genderId` was `@NotNull` in the backend; the backend core made it optional after this was reported, and the FE sends no gender.
- The backend still returns unit/position/department/gender ids and names on `InternalUserResponse` (null when reference tables are empty). The FE core does not render them; a project that populates those tables can add columns back in `InternalUser`.

## Verification

Run on Windows (Git Bash), Node 20.20.2, pnpm 10.4.1, from `C:\Users\tuannd103\FPT\core\fe`:

| Command                                                     | Result                                                                                                                                                      |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install`                                              | Dependencies installed and lockfile updated (`apps/web` importer). The root `prepare` script (`lefthook install`) fails because the folder is not a git repository; [Inference] it should pass once the folder is inside a git repository (not tested). `pnpm install --frozen-lockfile --ignore-scripts` succeeds. |
| `npx tsc --noEmit` (in `apps/web`, also covers `packages/ui`) | 0 errors                                                                                                                                                    |
| `npx eslint . --max-warnings 0` (in `packages/ui`, `packages/lib`) | 0 errors, 0 warnings                                                                                                                                  |
| `npx eslint` on `apps/web/src` (using the `packages/ui` binary and the app config) | 0 errors; warnings only (unused imports/vars, hook dependency lists), all inherited from the source code. `apps/web` has no `lint` script.     |
| `pnpm build` (turbo -> `vite build && tsc --noEmit`)        | Succeeds                                                                                                                                                    |
| `npx prettier --check "apps/web/src/**/*.{ts,tsx,json}"`    | Clean (files touched by prettier now use LF line endings)                                                                                                   |

Leftover grep (`cpa`, `consular`, `citizen`, `duplicate`, `datashare`, `bng`, `csdldc`, `mofa`, `bss`, `tkdt`, `nso`, `migration`, province, domain Vietnamese terms) over the whole tree excluding `node_modules`/lockfile: no hits. Intentional remaining matches: `FIS_*` env prefix (repo convention, kept so existing env files and CI keep working) and generic UI wording ("Duplicate" menu demo item, `duplicateGroups` in `NewsTicker`).

## Known limitations

- `apps/web/Dockerfile` is unchanged from the source: it copies only `package.json`/`pnpm-lock.yaml`/`pnpm-workspace.yaml` into the build stage, so it needs a build context that includes the workspace packages. Not verified with Docker.
- No screen creates internal users (the source created them through the org sync, which is removed from the backend). Add a create dialog if the project provisions internal users from the UI.
- `ExternalUser` create/update depend on the backend change above; verify against the current `core/be`.
- `shared/components/examples` and `ComponentsShowcase.tsx` (UI component demos) are kept as developer reference; nothing routes to them.
- `routes/modules.tsx` and `routes/$.tsx` were edited (registry hook-up, removal of domain colours and hard-coded paths) because the extraction required it; both are normally change-controlled files.
