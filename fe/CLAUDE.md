# Project Context

Domain-agnostic frontend core/starter (React 19, TypeScript, Vite 7, pnpm + Turborepo). App in `apps/web`, shared UI in `packages/ui`, shared libs in `packages/lib`. See `README.md` for layout, scripts, env keys and how to add a module; `CONVENTIONS.md` for the coding standard; `EXTRACTION_NOTES.md` for what was removed and the extension points.

**Navigation (don't over-read):**

- Looking for ONE known symbol (hook/component/string) -> `grep` directly.
- Working inside a feature screen (`apps/web/src/pages/{Domain}/{Screen}/`) -> the file layout is fixed (see CONVENTIONS section 1): `index.tsx` · `components/` · `hooks/use{Screen}*` · `services/` · `types/`. Use `pages/SystemAdministration/Role` as the template.
- Project-specific extension points live in `apps/web/src/config/`: `registerModules.ts` (entry), `moduleRegistry.ts` (module root dashboards), `menuBadgeRegistry.ts` (sidebar badges). Core enums/options live in `apps/web/src/constants/options/`.

## Stack

- React 19, TypeScript, Vite 7
- TanStack Router (`routeTree.gen.ts` is auto-generated, never edit)
- TanStack Query v5 (server state), TanStack Table
- Tailwind CSS v4
- Axios (auth interceptor in `lib/axios.ts`)
- i18next (Vietnamese + English)
- pnpm monorepo + Turborepo
- Shared UI: `@workspace/ui` (`packages/ui/`)

## Rules (non-negotiable checklist; detail and examples in `CONVENTIONS.md`)

- Screen `index.tsx` is presentation-only (`memo()`) and **must `export default`** the component; logic in `use{Screen}Page`. Routing is dynamic (`routes/$.tsx` + backend menu): a screen renders only with a matching backend menu entry; do NOT add a file under `routes/`.
- API calls go through the `request` instance in `lib/axios.ts`, never a bare axios. Service functions are typed with `ApiResponse<T>` / `PaginatedResponse<T>`; endpoints mirror backend verb-paths (`{res}/search`, `/{id}`, POST `/create|/update|/delete`).
- Server state via TanStack Query: `useQuery` keyed by a `{screen}Keys` factory; `useMutation` + invalidate keys on success; `toast` for feedback, `confirm({ variant: 'destructive' })` for destructive actions.
- Permission-aware actions use `ActionButton` (`actionCode`/`actionType`) or `usePermission(menuCode, action)`; never gate manually. URL pattern `/parentUrl/{action}`.
- i18n is mandatory: `useTranslation()` `t('key')`; add keys to `i18n/locales/{domain}/{vi,en}.json` (both languages) and register the namespace in `i18n/locales/index.ts`. No hard-coded strings.
- UI primitives come from `@workspace/ui/components/{Name}`; do not duplicate them. Forms: `react-hook-form` + `zod`.
- `routeTree.gen.ts` is auto-generated, never edit. localStorage only through `lib/storage.ts`. Env vars use the `FIS_` prefix (values in `.env`, never committed).
- Keep the core domain-agnostic: no business enums, endpoints or strings in `src/constants`, `src/shared`, `src/providers`, `src/routes` or `packages/ui`. Project behaviour plugs in through `src/config/*` registries and `src/pages/{Domain}`.
- Don't modify without explicit confirmation: `packages/ui` core components, `lib/axios.ts` interceptors, `providers/AuthProvider.tsx`, `providers/MenuPermissionProvider.tsx`, `routes/$.tsx`, `routes/modules.tsx`, `vite.config.js`.

## Verification

Run from `apps/web`: `npx tsc --noEmit` (never `tsc -b`, it litters `src/` with generated files) and `pnpm build` (`vite build && tsc --noEmit`). Lint packages with `pnpm lint` from the root.
