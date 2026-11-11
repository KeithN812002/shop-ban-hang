# CODING CONVENTIONS — core frontend starter (apps/web)

> The **standard for writing code in this repo**, derived from the existing screens (sample: `pages/SystemAdministration/InternalUser` and `Role`).
> Read this before adding/changing a screen, service, hook, or component.
> CLAUDE.md holds the short checklist; this file is the detail + examples.
> Shared UI lives in `packages/ui/src/components/{Name}` and is imported as `@workspace/ui/components/{Name}`.

---

## 1. Screen anatomy — thin `index.tsx`, logic in `use{Screen}Page`

```tsx
const InternalUserPage = memo(() => {
  const { t, title, finalLoading, loadingMessage, showFullSkeleton,
          handleActiveBulk, selectedRows,
          filterProps, tableProps, dialogProps } = useInternalUserPage()   // ONE orchestration hook
  return (
    <LoadingOverlay isLoading={finalLoading} text={loadingMessage}>
      <PageContainer title={title} isLoading={showFullSkeleton} loadingType="table-list-actions">
        <FormProvider {...filterProps.methods}><InternalUserFilter .../></FormProvider>
        <ActionButton onPress={handleActiveBulk} actionCode="active-bulk" icon={Unlock} label={t('user.actions.activeBulk')} />
        <InternalUserTable {...tableProps} />
        <InternalUserFormDialog {...dialogProps} />
      </PageContainer>
    </LoadingOverlay>
  )
})
```

- `index.tsx` is **presentation only** + `memo()`. All state/handlers come from **`use{Screen}Page()`** (which composes `use{Screen}Mutations`, `use{Screen}Filters`, `use{Screen}TableState`).
- Layout/primitives from `@workspace/ui` (`PageContainer`, `LoadingOverlay`, ...). Don't build your own page shell.
- ❌ No `fetch`/axios calls, no business logic, no query hooks called directly in `index.tsx`.

---

## 1b. Making a screen REACHABLE (routing is dynamic, not file-based)

Screens in `pages/` are **NOT** TanStack file-routes. They are lazy-loaded by the catch-all
`routes/$.tsx`, which does `import.meta.glob('../pages/**/*.tsx')` and resolves the current
**menu URL → a page module path**. So a new screen renders only if ALL of:

1. The screen's `index.tsx` does **`export default`** the page component.
    ```tsx
    const OrderPage = memo(() => { ... })
    OrderPage.displayName = 'OrderPage'
    export default OrderPage          // REQUIRED — dynamic loader imports the default export
    ```
2. The component may receive `{ menuItem }: { menuItem: MenuItem }` (most screens do — use it for title/context).
3. The screen sits at the `pages/...` path that the **menu entry's URL** maps to.
4. A **menu entry + permission exist** — these come from the **backend** (menu data via `MenuDataProvider`,
   permission via `MenuPermissionProvider`), NOT from frontend code. A screen with no menu entry is unreachable.

> ⚠️ Building the screen files alone is NOT enough — without the matching backend menu entry it never shows.
> There is no route file to add; do not create one under `routes/`.

Project-level extension points (all in `src/config/`, wired from `registerModules.ts`, which `main.tsx` imports):

- `registerModuleDashboard(rootUrl, { component, fallbackTitle })` — a lazy dashboard for a module root URL.
- `registerMenuBadgeProvider(hook)` — a hook `(menuTree) => Record<normalizedPathFolder, { count, className }>` that adds sidebar badges. Register at module load; the list must not change after mount.

---

## 1c. Skeletons — one shape per layout, never borrow another screen's `loadingType`

`PageContainer` takes `isLoading` + `loadingType`, where `loadingType` is the `PageLoadingType` union declared in
`packages/ui/src/components/PageContainer/skeletons/PageSkeleton.tsx`. Grid screens can almost always reuse a stock
shape: `table-list` (filter + table), `table-list-actions` (adds a bulk-action button row — only when the screen
REALLY has that row), `table-only`, `sidebar-table`, `permission` (tree + form), or the generic `panel`.

⚠️ A screen with its own layout needs its own shape, **do NOT point it at another screen's `loadingType` just to be
done with it**. A wrong shape is worse than no skeleton: the page flashes one layout, then swaps to the real one.
Adding a shape takes 3 steps — create `skeletons/{Screen}Skeleton.tsx` → add the value to the `PageLoadingType` union →
add the `case` in `PageSkeleton`.

When building a shape:

- Follow the real screen's layout classes: same `flex`/`grid`, same row heights, same padding, same alignment.
- **Measure from the component itself, never estimate.** Measured examples: a `Badge` with `px-2 py-0.5` is 22px tall,
  the default `Button` size is `h-8`, `TableHead` is `h-11`, and `TableCell` defaults to `align-middle` —
  only a column declaring `meta.className` differs. For labels measure the TEXT width
  (`Range.getBoundingClientRect()`), not the width of the containing cell.
- ⚠️ Put `animate-in fade-in` on **each inner block, never on the outer wrapper**: the `enter` keyframes carry
  `transform`/`filter`, so the wrapper becomes the containing block of the `fixed` footer and the footer jumps for as
  long as the animation runs.
- When a screen's layout changes, fix its shape in the same commit, otherwise it drifts again after a few UI tweaks.

---

## 1d. Read-only information blocks (not a form)

Render read-only data with `dl`/`dt`/`dd`, **never with a disabled field** (`BsInput isDisabled`): a locked input is
twice as tall and adds no information. For the same reason, don't wrap the value in a bordered grey box — it still
reads as a locked input, only built out of a `div`.

The repo-wide idiom: the label `text-xs font-semibold uppercase tracking-wider text-muted-foreground`
sits **ABOVE** the value `text-sm font-medium`.

⚠️ In a narrow column (a 1/3 panel, a dialog) stacking is mandatory — never put label and value side by side: a label
column pinned at something like `w-32` eats almost half the width, so a long value wraps while the box still has room.
Separate fields with `divide-y` + `py-3 first:pt-0` to give the box a rhythm instead of free-floating text. Each group
of timestamps (sent / closed) is a group of its own — pile them all into one 2-column grid and two different events
read as a single block. And don't repeat a value that already appears in the page title.

---

## 1d-bis. Empty states — one component, five kinds, never a hand-rolled `div`

An empty screen must answer **why** it is empty, not just that it is. Every empty block in the app is
`EmptyState` (`@workspace/ui/components/EmptyState`) with a `kind`; never a bare `<div className="text-center
text-muted-foreground">`, never a hand-drawn SVG, never a toast on its own.

| `kind`                 | When                                                                                                      | Icon                          | Default copy                 |
| ---------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------- | ---------------------------- |
| `no-records` (default) | Nothing has been created yet                                                                              | `Inbox`                       | Chưa có dữ liệu              |
| `no-match`             | A filter or search term is applied and nothing matched                                                    | `SearchX`                     | Không có kết quả khớp bộ lọc |
| `needs-input`          | The user must pick something first (report conditions, a row in a master/detail panel)                    | `MousePointerClick`           | Chưa chọn điều kiện          |
| `blocked`              | Business state, permission or configuration hides the content — **always override `title`/`description`** | `Lock`                        | Không xem được nội dung này  |
| `error`                | The query failed                                                                                          | `TriangleAlert` (destructive) | Không tải được dữ liệu       |

Copy lives in `common.empty.*`. `title`/`description` are optional — pass them only when the screen knows something
the preset cannot (a merged case naming its target, a disabled feature naming where to re-enable it).

Grids never choose the copy themselves. `DataTable` and `TableEmpty` take the raw facts and derive the kind through
`resolveEmptyKind`:

```tsx
<DataTable data={rows} isLoading={query.isLoading} isError={query.isError} hasActiveFilter={hasActiveFilter} />
```

⚠️ **`isError` is not optional in practice.** Without it a failed request renders the same "Chưa có dữ liệu" as an
empty table, and both the user and the tester read a broken API as "no records".

`action` puts a button under the description (a retry, a filter reset, a create shortcut) — that slot is the reason no screen
needs to build its own card. `tone="destructive"` is for a _required_ list left empty (`Transfer`,
`RolePermissionTree`), not for errors.

### The look is fixed: centred icon + text, nothing else

No background, no border, no card, no dashed frame, no drop shadow, no ring around the icon — an empty state is an
icon over centred text and it inherits whatever surface it sits on. `className` is for **spacing and height only**
(`min-h-[140px]`, `py-6`). Don't pass `iconSize` either: 48px for `default`, 20px for `compact`, no exceptions, so two
screens never show the same state at two sizes. A wrapper `div` around it must not add chrome of its own, with one
exception: when the empty state fills a whole tab or section of a dialog/detail view, the wrapper keeps the section's
frame (`rounded-md border`) so the area still reads as a block instead of loose text floating in the dialog.

---

## 1e. Footer button bar — use `PageActionBar`, don't copy the classes

Every screen with a pinned bottom button bar builds it with `PageActionBar` (`@workspace/ui/components/PageActionBar`),
never by re-typing the `fixed bottom-0 ...` string into `className`:

```tsx
<PageActionBar>
    <ActionButton actionType="save" onPress={handleSave} />
    <ActionButton actionType="back" onPress={handleBack} />
</PageActionBar>
```

The bar is **65px** tall — **exactly the header height**, its 64px body sitting on the 8pt grid. That height is pinned
with `min-h-[65px] items-center`, not derived from padding: screens using different button sizes (`ActionButton` is
32px, the default `Button` is 36px) still come out at 65px. With `py-4` alone, a 36px-button screen would be 69px.

`align="between"` for screens with a left-hand button; `className` for per-screen effects (scroll-state shadow, the
skeleton's `animate-in`). The skeleton must use this very component, otherwise the page jumps once loading finishes.
The left offset already ships as `sm:left-[var(--content-left)]` — **never hardcode** `sm:left-70` or
`sm:left-[280px]`, or collapsing the sidebar leaves the footer 216px short.

### The scroll region that goes with it, and the **16px** bottom gap

The scroll region uses `PageScrollArea`, or the `PAGE_SCROLL_AREA` constant (+ `PAGE_SCROLL_AREA_BLEED`) when the
element is not a `div` (`form`, `Accordion`, `TabPanel`):

```tsx
<PageScrollArea>…</PageScrollArea>
<form className={cn(PAGE_SCROLL_AREA, PAGE_SCROLL_AREA_BLEED)}>…</form>
```

Three rules:

1. **`pb-4` (16px) — the gap between the last item and the button bar.** It matches the gap between two cards
   (`space-y-4`), so the last item does not "stick" to the bar more tightly than to the card above it, and it matches
   the bar's own vertical padding, so both sides are symmetric about the rule line. Don't pick a different number per
   screen.
2. **Do NOT reserve room for the bar yourself.** `PageContainer` already does that with
   `has-[.page-action-bar]:pb-[41px]` (41px = the 65px bar − `DashboardLayout`'s 24px bottom padding), so the scroll
   region ends exactly at the bar's top edge. Screens used to reserve their own (`pb-16` / `pb-12` / `pb-10` / `pb-6` /
   `pb-1`) and produced four different gaps: 35px, 11px, −1px, 40px.
3. **Only the real scrolling layer gets `pb-4`.** Nest two layers (a `form` wrapping a `TabPanel`) and set it on both
   and the padding adds up to 32px, 48px.

`scrollbar-hide` is mandatory (the whole repo hides scrollbars); the `-mr-6 pr-6` pair keeps content flush with the edge.

⚠️ The button bar must be a **sibling** of the scroll region, never inside it — `PageContainer` carries the rule
`[&>.overflow-y-auto:only-child]:pb-6`, which forces `pb-6` onto the scroll region when it is the only child,
swallowing the bottom padding and letting the bar cover the last block.

---

## 1f. Header area — only two numbers, **8px** and **16px**

Badges/chips describing the record go into `PageContainer`'s `meta` prop, **never into a badge row hand-built inside
the page body**:

```tsx
<PageContainer
    title={title}
    meta={
        <>
            <Badge variant="outline">
                {t('order.fields.type')}: {typeName}
            </Badge>
            <OrderStatusBadge status={status} />
        </>
    }
>
```

| From → to                        | Gap      | Provided by                   |
| -------------------------------- | -------- | ----------------------------- |
| title → meta row                 | **8px**  | `PageHeader` (`mt-2`)         |
| meta row → tab bar / first block | **16px** | `PageContainer` (`space-y-4`) |
| tab bar → content                | **16px** | `Tabs` (`gap-4`)              |
| title → first block (no meta)    | **16px** | `PageContainer` (`space-y-4`) |

Only what is _glued to_ the title gets 8px; every other boundary is 16px — the same rhythm as the bottom gap in §1e.

### The tab bar compensates 8px for the tab's own padding

Each `Tab` has 12px of `padding-top`, so leaving the 16px box gap makes the eye read **29px** from the badge down to
the tab text (16 + 12 + leading) — 3.6× the title→badge distance, and the tabs look like they dropped off. That is why
the `Tabs` root already carries `-mt-2`: the box gap falls to 8px, the optical gap to **21px**. Don't remove `-mt-2`
and don't compensate a second time per screen.

### The tab bar must stay pinned

Put the scroll region **inside `Tabs`, right after `TabList`** — don't wrap the tabs themselves:

```tsx
<div className="flex-1 flex flex-col min-h-0 overflow-hidden">
    <Tabs className="flex-1 flex flex-col min-h-0">
        <TabList>…</TabList>
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide -mr-6 pr-6 pb-4">
            <TabPanel>…</TabPanel>
        </div>
    </Tabs>
</div>
```

Wrap the scroll region around `Tabs` and the tab names scroll out of sight, leaving the user unsure which tab they are
on. The `flex-1 min-h-0` chain must run unbroken from the outer element down to the scroll region; one missing link and
the content is clipped and won't scroll.

**Don't** override `space-y-2!` on `PageContainer`, **don't** add `mt-N!` on `TabPanel`: 19 screens used to override
`space-y-2!` and 58 `TabPanel`s added their own `mt-1!`/`mt-3!`, producing four different combinations (8/8/12, 8/8/20,
16/16/—, 16/—/—). `TabPanel` no longer carries a default `mt-2` either; the spacing comes from `Tabs`' `gap-4`.

---

## 2. Service layer — `request` from `lib/axios`, typed, endpoints mirror BE

```ts
import { request } from '@/lib/axios'
import { cleanParams } from '@/utils/api.utils'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'

export const searchUsers = async (p: UserFilterRequest): Promise<PaginatedResponse<UserResponse>> => {
    const res: ApiResponse<UserPageResponse> = await request.get('sa/internal-user/search', { params: cleanParams(p) })
    const d = res.data
    return { items: d?.items ?? [], total: d?.total ?? d?.totalElements ?? 0 /* ...fallbacks */ }
}
export const createUser = async (data: UserCreateRequest): Promise<void> => {
    await request.post('sa/external-user/create', data)
}
export const fetchUserDetail = async (id: string) => (await request.get(`sa/internal-user/${id}`)).data || undefined
```

- **Always** import `{ request } from '@/lib/axios'` — never a bare `axios.create()` (the shared instance carries auth/interceptors).
- Type every call: `ApiResponse<T>` / `PaginatedResponse<T>` from `@/types/api.types`.
- **Endpoints mirror the backend verb-paths**: `{domain}/{resource}/search`, `/{id}`, **POST** `/create`, `/update/{id}`, `/delete/{id}` (see the backend conventions).
- Clean query params with `cleanParams(...)`; normalize backend pagination (`items/total/totalPages`, fallbacks `totalElements/pageNumber`).
- Services live in the screen's `services/` folder (`services/{screen}Service.ts` + `mapper.ts`). A domain whose screens share one API may keep a domain-level `services/` folder instead; follow the nearest existing screen.

---

## 3. Data layer — TanStack Query: query hooks + mutation hooks + key factory

```ts
// hooks/index.ts
export const userKeys = { all: ['users'] as const, list: f => [...userKeys.all, 'list', f] /* ... */ }
export const useUsers = (filters, trigger?) =>
    useQuery({ queryKey: userKeys.list(filters), queryFn: () => searchUsers(filters) })
export const useCreateUser = () => useMutation({ mutationFn: createUser })
```

```ts
// use{Screen}Mutations: orchestrate + side-effects
const qc = useQueryClient()
const { t } = useTranslation()
const createMutation = useCreateUser()
// on success → toast.success(t('...')) + qc.invalidateQueries({ queryKey: userKeys.all })
// destructive action → await confirm({ title: t('...'), variant: 'destructive' })
```

- Reads via `useQuery` keyed by a **`{screen}Keys`** factory; writes via `useMutation`.
- After a successful mutation → **invalidate** the relevant `{screen}Keys` (don't hand-refetch).
- User feedback → `toast` (`@workspace/ui/components/Sonner`); destructive confirms → `confirm({...variant:'destructive'})` from `@workspace/ui/components/ConfirmDialog`.

---

## 4. Permissions

- Action buttons use **`ActionButton`** with `actionCode` + `actionType` — it renders/enables based on the user's permission for that action (don't gate manually with `&&`).
- Lower-level: `usePermission(menuCode, action)` / `ProtectedButton` / `PermissionGuard`. URL pattern `/parentUrl/{action}`.
- **Never override a button's font size or weight.** `buttonVariants` fixes `h-8 px-3 text-sm font-medium` (size `default`); className should only carry COLOUR and layout (`ml-auto`, `gap-*`). Scattered `text-xs` and `font-semibold`/`font-bold` on ~60 buttons used to leave 2-3 different button text sizes on a single screen, the small ones hard to read — all cleaned up, don't bring them back. DELIBERATE exceptions (leave alone): `DataTable` (column headers `font-bold`), `Select`/`BsIconPicker` (buttons that act as inputs, `font-normal`), `DatePicker` (the "Today" quick-pick button).
- Never show an action the user can't perform — drive visibility through these, not ad-hoc checks.
- **Every text button carries an icon, placed BEFORE the label.** Pick the action from `ACTION_PRESETS`
  (`components/Common/ActionButton.tsx`) via `actionType` — it supplies the icon, the default label and, for
  workflow actions, the colour. `label` only overrides the text: `actionType="back" label="Thoát"` keeps the
  `ArrowLeft` icon. Pass `icon` only for an action that has no preset.

    | `actionType`                              | Icon              | Default variant |
    | ----------------------------------------- | ----------------- | --------------- |
    | `addNew`                                  | `Plus`            | default         |
    | `save` · `create` · `update` · `saveData` | `Save`            | default         |
    | `saveDraft`                               | `FileText`        | default         |
    | `delete`                                  | `Trash2`          | default         |
    | `cancel` · `close`                        | `X`               | default         |
    | `back`                                    | `ArrowLeft`       | default         |
    | `search`                                  | `Search`          | default         |
    | `sync`                                    | `RefreshCcw`      | default         |
    | `upload`                                  | `Upload`          | default         |
    | `export`                                  | `FileSpreadsheet` | default         |
    | `send`                                    | `Send`            | default         |
    | `confirm` · `complete` · `approve`        | `Check`           | default         |
    | `verify`                                  | `CheckCircle`     | default         |
    | `return`                                  | `Undo2`           | `warning`       |
    | `reject`                                  | `Ban`             | `destructive`   |
    | `unApprove`                               | `CircleSlash`     | `info`          |
    | `resendBulk`                              | `RotateCw`        | `warning`       |

    Colours come from `buttonVariants` (`default`, `destructive`, `warning`, `info`, `success`, `outline`…), never
    from `variant="unstyled"` + `bg-*` classes. Exempt: icon-only buttons (`size="icon"`), `variant="link"` text links,
    the DatePicker "Today" pick, and raw `<button>` used as a menu item, segmented toggle or map control.

---

## 5. i18n — mandatory

- Every user-facing string goes through `const { t } = useTranslation()` → `t('domain.key', { args })`. **No hard-coded VI/EN text.**
- Keys live in `i18n/locales/{domain}/{vi,en}.json` (one folder per domain). Add the key to **both** `vi.json` and `en.json`, and register a new domain folder in `i18n/locales/index.ts`.

---

## 6. Hard rules

- ❌ Never edit `routeTree.gen.ts` (auto-generated). Pages are not routes; see section 1b.
- ❌ Never call a bare `axios` — always `request` from `@/lib/axios`.
- ❌ Never read/write `localStorage` directly — use `lib/storage.ts` helpers.
- ❌ Never hard-code UI primitives — import from `@workspace/ui/components/{Name}`.
- ❌ Never hard-code config/secrets — values come from `FIS_*` env (not committed).
- Forms: `react-hook-form` (`FormProvider`/`useFormContext`) + `zod` validation.
- Keep the core domain-agnostic: business enums, endpoints and strings belong in `src/pages/{Domain}` and `src/config/*` registrations, not in `src/constants`, `src/shared`, `src/providers`, `src/routes` or `packages/ui`.

---

## 7. Before you finish

- From `apps/web`: `npx tsc --noEmit` (never `tsc -b`) and `pnpm build`; fix every error properly, no `any`/`@ts-ignore` workarounds.
- New module: matching backend menu entry + permission, i18n namespace registered, extension points registered in `src/config/registerModules.ts`.
