# CODING CONVENTIONS — core backend

> The **standard for writing code in this repo**. Read this before adding/changing a controller, service, entity, or query.
> CLAUDE.md holds the short non-negotiable checklist; this file is the detail and examples.
> Layering rule above all: **controllers (`res-*`) stay thin — all logic lives in services (`bom-*`).**

---

## 1. Controller (`res-{domain}`)

```
@RestController
@RequestMapping("/sa/role")                      // base = /{domain}/{resource}; NO /api (a gateway may strip it)
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;       // inject the INTERFACE, final, via constructor

    @GetMapping("/search")
    public Response<?> search(@Valid @ModelAttribute RoleFilterRequest filter) {
        return Response.ok(roleService.search(filter));   // delegate only — no logic here
    }

    @PostMapping("/create")
    public Response<?> create(@Valid @RequestBody RoleCreateRequest request) {
        roleService.create(request);
        return Response.ok();
    }
}
```

**Rules:**
- Return type is always `Response<?>` (or `Response<T>`); wrap with `Response.ok(...)` / `Response.ok()`. Never return a raw entity/DTO.
- **HTTP verb convention (NOT textbook REST):**
  - Read: `GET /search` (paged), `GET /{id}` (detail), `GET /...options|types`
  - Create: **`POST /create`**
  - Update: **`POST /update`**
  - Delete: **`POST /delete`**
  - → Mutations use **POST + verb path**, not PUT/DELETE. Stay consistent with this.
- Body input: `@Valid @RequestBody {X}Request`. Query/filter input: `@Valid @ModelAttribute {X}FilterRequest`.
- **Permission is enforced by default** (via `CustomAuthorizationFilter`). Add `@SkipPermissionCheck` ONLY for intentionally public endpoints (e.g., lookups/options).
- Do NOT add `@Tag` / `@Operation`; the endpoint name plus its DTO is enough to read the API.
- No business logic, no repository access, no `try/catch` of business errors in controllers.

---

## 2. Service (`bom-{domain}`)

Interface in `service/{X}Service.java`, impl in `service/impl/{X}ServiceImpl.java`.

```
@Slf4j
@Service
@RequiredArgsConstructor
public class RoleServiceImpl implements RoleService {

    private final RoleRepository roleRepository;
    private final ModelMapper modelMapper;

    @Override
    @Transactional(readOnly = true)                 // reads = readOnly
    public PageResult<RoleResponse> search(RoleFilterRequest filter) {
        Pageable pageable = PageableUtils.pageable(filter.getPageNumber() - 1, filter.getPageSize(), filter.getSortExpr());
        Page<Role> page = roleRepository.findAll(buildSearchSpec(filter), Objects.requireNonNull(pageable));
        return PageableUtils.toPageResult(page, role -> modelMapper.map(role, RoleResponse.class));
    }

    @Override
    @Transactional                                  // writes = no readOnly
    @CacheEvict(value = "sa:role:options", allEntries = true)
    public void update(RoleUpdateRequest request) {
        Role role = roleRepository.findById(Objects.requireNonNull(request.getId()))
                .orElseThrow(() -> new BaseException("APP_DATA404"));
        modelMapper.map(request, role);
        roleRepository.save(role);
        log.info("Updated role: id={}", role.getId());            // log on mutations
    }
}
```

**Rules:**
- Always implement the matching `{X}Service` interface; annotate `@Service @RequiredArgsConstructor @Slf4j`.
- Inject the `{X}Repository` + `ModelMapper` as `private final`.
- `@Transactional(readOnly = true)` on read methods; `@Transactional` on write methods.
- Cacheable lookups: `@Cacheable(value="{domain}:{resource}:{key}", key="#a0")`; evict on writes with `@CacheEvict`.
- Entity↔DTO mapping via `modelMapper.map(src, Target.class)`, or `Target.builder()...` for explicit shaping.
- `log.info(...)` on create/update/delete (state changes).
- This is the ONLY layer allowed to touch repositories.

---

## 2b. Business actions: status transitions, history, current user

Beyond CRUD, a domain may expose **action endpoints** (`POST /suspend`, `/reopen`, `/close`, `/assign`...). The standard flow:

```
@Transactional
public void suspend(SuspendRequest request, HistorySourceEnum source) {
    Case c = caseRepository.findById(Objects.requireNonNull(request.getId()))
            .orElseThrow(() -> new BaseException("APP_DATA404"));

    // 1) GUARD: validate the transition is legal from the current status
    if (c.getStatus() != CaseStatus.PENDING && c.getStatus() != CaseStatus.PROCESSING) {
        throw new BaseException("case.update.only.pending.or.processing");
    }

    CaseStatus statusBefore = c.getStatus();        // 2) capture before
    c.setStatus(CaseStatus.SUSPENDED);              // 3) mutate
    caseRepository.save(c);

    // 4) record the change in the domain's history service
    caseHistoryService.logStateChange(c, HistoryActionEnum.SUSPEND, source, statusBefore);
}
```

**Rules for state-changing actions:**
- Always **guard the transition** (check current status against the allowed set) → throw `BaseException` if illegal. Don't mutate blindly.
- Capture `statusBefore`, then record the change via the domain's **`{X}HistoryService.logStateChange(...)`** with an **action enum** + a **source enum** (tells *which screen/flow* triggered it).
- Shared transition logic lives in **`{X}CommonServiceImpl`**; per-flow services delegate to it, passing their `source`.
- **Current user / unit** come from `SecurityUtils.getCurrentUsername()` / `SecurityUtils.getCurrentUnitId(cacheService)` — never read them from the request body.
- **Cross-module dependency is allowed** between `bom-*` modules (e.g. a `bom-orders` service may inject `bom-sa` repositories). Keep the direction business→business or business→core; never depend on a `res-*` module.

---

## 3. Queries — `SpecificationBuilder`, never ad-hoc JPQL for filtering

```
import static com.fpt.core.persistence.spec.JpaFieldSpecifications.eq;
import static com.fpt.core.persistence.spec.JpaStringSpecifications.like;

SpecificationBuilder<Role> builder = new SpecificationBuilder<>();
builder.and(like("name", filter.getName()));
builder.and(eq("status", StatusBasic.ACTIVE));
roleRepository.findAll(builder.build(), pageable);
```

- Repositories that filter extend `JpaSpecificationExecutor<T>`.
- Build dynamic queries with `SpecificationBuilder` + the static specs in `core-persistence` (`JpaFieldSpecifications`, `JpaStringSpecifications`, `JpaJoinSpecifications`).
- Derived query methods (`findByUserNameAndIsDeletedFalse`) are fine for fixed lookups.
- Pagination: always `PageableUtils.pageable(...)`; return `PageResult<T>` from service.
- Repository name = `{Entity}Repository`, in `bom-{domain}/repository/`.

---

## 4. Errors — `BaseException` only

```
throw new BaseException("role.name.notBlank");       // i18n message key
throw new BaseException("APP_DATA404");              // business error code
throw new BaseException("err.key", arg1, arg2);      // with message args
```

- Throw `BaseException` for all business/validation errors — never raw `RuntimeException` or returning error objects.
- The `code` is either an **i18n message key** (e.g. `role.name.notBlank`) or a **business error code** (`APP_*`). The global handler turns it into a `Response` with `ErrorEnum`.
- **Every `code` you throw MUST have an entry in BOTH** `core-common/src/main/resources/messages.properties` **and** `messages_en.properties`. A thrown code without a message = broken/untranslated error shown to the user. Add the key when you add the throw, and run `python scripts/check-i18n.py`.
- User-facing messages MUST be message keys — never hard-code Vietnamese/English strings in code.

---

## 5. Entities

- `@Entity @Table(name="...")`; entity in `bom-{domain}/entity/`.
- **Default base = `EntityBase`** (audit: created/updated by/date).
- Base classes available in `core-persistence`: `EntityBase`, `EntitySoftDeleteBase` (+soft-delete fields).
- **Soft delete is SELECTIVE, not universal.** When an entity is soft-deletable:
  - it carries `isDeleted` (`@Column(name="is_deleted")`) — either inherited from `EntitySoftDeleteBase` or declared on the entity;
  - `delete()` sets `isDeleted=true` (don't hard-delete);
  - every read filters it out: `repository.findById(id).filter(e -> !e.isDeleted())` or a `...IsDeletedFalse` derived query.
  - Entities WITHOUT `isDeleted` are hard-deleted normally — check the entity before assuming soft-delete.
- New enum field → add the enum in `core-common/.../enums/` only when it is generic; domain enums belong in the owning `bom-{domain}` module.
- Open-ended values that projects extend (email event types, template modules) are **string codes**, not enums.

---

## 6. DTOs

- Request: `{X}AddRequest`/`{X}CreateRequest`, `{X}EditRequest`/`{X}UpdateRequest`, `{X}FilterRequest` (+ `@Valid` validation annotations).
- Response: `{X}DetailResponse`, `{X}Response` (+ `@Builder` where shaped manually).
- Live in `bom-{domain}/dto/{subpackage}/`. Don't expose entities directly to controllers.

---

## 7. Config & secrets

- All operational values (DB, Redis, MinIO, SSO, timeouts) come from **Consul** → bound to `*Properties` classes.
- Never hard-code hosts/credentials/URLs/keys in Java. Never paste real configuration values into code or docs. Secrets use Jasypt `ENC(...)`.

---

## 8. Before you finish

- Run the narrowest relevant Maven build/test first (`mvn -q -DskipTests compile -pl <module> -am`), then broaden when a shared contract in `core-*` (`Response`, `PageResult`, `BaseException`) moved.
- Adding/renaming/removing message keys → `python scripts/check-i18n.py` must report 0 issues.
- Keep `README.md` / `CLAUDE.md` in sync when modules, config keys, or endpoint paths change.
