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

- [ ] Step 1 — Scaffold
- [ ] Step 2 — Auth
- [ ] Step 3 — Query workspace + sessions
- [ ] Step 4 — Schema explorer
- [ ] Step 5 — Audit log
- [ ] Step 6 — Schema metadata
- [ ] Step 7 — Polish
