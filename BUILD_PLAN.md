# BanQuery Frontend — Build Plan

Angular app for the BanQuery text-to-SQL backend (`../backend/`). Full design/contract groundwork
already exists — this file is the execution plan for turning it into working code in this folder.

## Source of truth

- **Backend contract**: `../backend/front_end_preparation/front_end_preparation.md` — every endpoint,
  DTO shape, and page-by-page integration flow, verified against the actual backend source.
- **Resolved backend gaps**: `../backend/front_end_preparation/problems_between_front_back.md` — all 6
  identified contract mismatches, all now implemented backend-side (session scoping split, audit-log
  turn/attempt DTOs, username filter on the admin session list).
- **Visual design**: `../backend/front_end_preparation/mockups/v4/` — the approved mockup (BTE-branded:
  navy `#17235E` / gold `#E7A83A` / maroon `#9C1B32`, Roboto + Public Sans display, Angular Material
  component shapes). Login headline copy is still pending final wording — build the login page
  structure now, swap the headline text in once decided.

## Stack (already agreed)

Angular (standalone components, no NgModules), Angular Material, signals + injectable services for
all shared state (no NgRx, no RxJS BehaviorSubjects), TypeScript strict mode.

## Build order

1. **Scaffold** — `ng new`, add `@angular/material`, routing, `provideHttpClient(withInterceptors(...))`,
   base Material theme seeded from the mockup's navy/gold/maroon palette.
2. **Auth** — `AuthService` (signal-based, localStorage-backed JWT), `LoginComponent` (built from
   `mockups/v4/Login.dc.html`), `auth.interceptor.ts`, `auth.guard.ts`, `admin.guard.ts`, toolbar +
   side-nav shell (from the shared chrome in every other mockup page, including the real BTE logo).
3. **Query workspace + sessions** — `TextToSqlService`, `SessionService`, `QueryWorkspaceComponent`
   (query-row + response-card layout per `mockups/v4/Main.dc.html`, not chat bubbles), session sidebar
   (list/resume/delete, owner-scoped `GET /api/v1/sessions`).
4. **Schema explorer** — `SchemaService`, table list (search) + table detail (columns + FK block) from
   `mockups/v4/SchemaExplorerList.dc.html` / `SchemaExplorerDetail.dc.html`. FK graph diagram is a
   fast-follow, not part of this pass.
5. **Audit log** — session-first flow (pick a session — own list for ANALYST, `GET /api/v1/sessions/all`
   with the `username` filter for ADMIN — then `GET /api/v1/audit-logs/session/{id}` for the turn/attempt
   trail), per `mockups/v4/AuditLog.dc.html`. No top-level flat list in v1.
6. **Schema metadata (admin)** — document list + generate/poll, structured preview/edit with diff-on-save,
   table search on the editor (per `mockups/v4/SchemaMetadataEditor.dc.html`), front-end-only diff view.
7. **Polish** — error-toast interceptor, loading states, responsive check, verify `GlobalExceptionHandler`'s
   actual error JSON shape live rather than assuming `{error: string}`.

## Verification per step

Run `ng serve`, run the backend (`docker-compose up -d` + `./mvnw spring-boot:run` in `../backend/`,
per its `CLAUDE.md`), exercise the feature in a real browser against the live backend with both an
ANALYST and an ADMIN test user, confirm network requests/responses match the contract doc. Don't
mark a step done on "it compiles" alone.

## Status

- [x] Step 1 — Scaffold. Verified (build + dev server). Details/problems: `etape_1.md`.
- [x] Step 2 — Auth. Verified live against the running backend (guard redirect, login page render,
  real 401 error handling, and successful admin login — shell + role-based nav confirmed). Details/
  problems: `etape_2.md`.
- [x] Step 3 — Query workspace + sessions. Verified live against the running backend (real question
  end-to-end through the LLM pipeline, session appears in sidebar, resume hydrates full history,
  delete with inline confirm). Tested with `analyst` only — see `etape_3.md` for what's not yet
  double-checked with `admin`. Details/problems: `etape_3.md`.
- [x] Step 4 — Schema explorer (`/tables` + `/tables/{name}` only; `/graph` diagram still a
  fast-follow, not built). Verified live against the real ~90-table schema: search narrows correctly,
  detail view renders columns/samples/FKs, FK links navigate correctly between tables. Details/
  problems: `etape_4.md`.
- [x] Step 5 — Audit log. Verified live: ANALYST sees only own sessions/trail (`GET /sessions`,
  own question end-to-end round-tripped through the audit trail), ADMIN sees any session via
  `/sessions/all` (+ username filter) and the reindex panel (trigger → poll → DONE, confirmed via
  network requests: `POST /reindex` 202 then `GET /reindex/status` 200×N). Details/problems:
  `etape_5.md`.
- [x] Step 6 — Schema metadata (admin). Verified live against the real ~103-table generated
  metadata: generate → poll → auto-navigate → auto-diff (confirmed "no differences" thanks to
  diff-aware carry-forward), edit + save (patch round-trip confirmed), copy (also caught and fixed
  the same route-reuse bug class from step 4), promote (status flip confirmed in the list),
  adminGuard re-confirmed blocking ANALYST. Details/problems: `etape_6.md`.
- [x] Step 7 — Polish. Shared error toast wired via `error.interceptor.ts`. Follow-up pass (still
  step 7) closed nearly every gray area: all 4 pipeline business statuses (SUCCESS/SCHEMA_ERROR/
  BLOCKED/IMPOSSIBLE) confirmed live with real LLM-generated failures, a real 403 confirmed via direct
  fetch, and responsive rendering actually verified visually at 768/1024px (via a body-width DOM
  constraint, since `resize_window` doesn't work in this environment) — which caught and fixed a real
  bug: the audit log's turn header truncated the status badge mid-word at narrow widths, fixed with
  `flex-wrap`. Only `EXECUTION_FAILED` and a genuine concurrent-409 remain unobserved (non-deterministic
  LLM / hard to force from one browser). Details/problems: `etape_7.md`.

## Open decisions not yet resolved (check before continuing)

None — login headline copy resolved: "Posez la question. BanQuery écrit le SQL." (chosen 2026-08-29).

