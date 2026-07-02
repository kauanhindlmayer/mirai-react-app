# Mirai: Vue → React Rewrite Implementation Plan

## Context

`mirai-app` (Vue 3 + PrimeVue + Pinia Colada) is being rewritten as `mirai-react-app`
(React + shadcn/ui + TanStack Query), using `mirai-app/docs/FEATURES.md` as the
behavioral/API source of truth. The React app already has a scaffold in place — this
plan sequences the remaining work on top of it, not from scratch.

This document is a checklist (mirroring the `mirai-app/docs/FEATURES.md` doc
convention) meant to be checked off incrementally, phase by phase, over multiple
sessions.

**What already exists in `mirai-react-app`** (confirmed by reading the code):

- React Router v8 in framework/file-route mode with `ssr: false` (`react-router.config.ts`) — SPA, not SSR.
- TanStack Query wired up (`src/lib/query-client.ts`, provider in `src/root.tsx`).
- shadcn/ui scaffolded (`components.json`, `radix-mira` style) with a starter set of primitives: avatar, breadcrumb, button, collapsible, dropdown-menu, field, input, label, separator, sheet, sidebar, skeleton, sonner, spinner, tooltip.
- `sidebar-07`-style dashboard shell (`app-sidebar.tsx`, `nav-main.tsx`, `nav-projects.tsx`, `nav-user.tsx`, `team-switcher.tsx`, `root-layout.tsx`) — currently wired to **hardcoded placeholder data**, not real orgs/projects.
- Login/signup shadcn auth blocks (`login-form.tsx`, `signup-form.tsx`) — functional UI, but `auth.ts`/`types/auth.ts` don't yet match the spec.
- `next-themes`-based `ThemeProvider` (dark/light only, no PrimeVue-style multi-preset picker yet).
- No axios/HTTP client wrapper yet — `src/api/auth.ts` uses raw `fetch` against relative `/api/...` paths, no auth header, no 401 handling, no localStorage persistence, no route guards.
- Only 4 routes registered (`/`, `/dashboard`, `/login`, `/signup`) vs. the ~20 in the spec's route map.

**Decisions made for this plan:**

- Stub features from spec §3 (GitHub integration, Pull Requests/Favorites tabs, Dashboard Settings/Copy Dashboard, Notifications) will be **replicated as visual stubs only** — none of them have backend API support in the endpoint catalog, so building them for real is backend-scoped work, out of bounds for this frontend rewrite.
- **Exception: Team creation** will be built for real (not stubbed), since `POST /projects/{projectId}/teams` already exists in the API catalog — this one only needs frontend work.
- Work item delete will be **standardized as working everywhere** (list context menu AND the detail dialog's overflow menu use the same `deleteWorkItem` mutation), resolving the inconsistency flagged in §3.

**New dependencies needed** (none currently installed): `@tanstack/react-table` (work item / tags tables), `@dnd-kit/core` (+ related packages, for Boards drag-and-drop and Wiki page reparenting), `recharts` (Dashboards), `@microsoft/signalr` (Retrospectives real-time), `@tiptap/react` + starter-kit (Wiki page rich text, replacing Quill). Additional shadcn primitives get pulled in per-task via `npx shadcn add <name>` (table, dialog, tabs, card, select, command, context-menu, alert-dialog, popover, badge, textarea, checkbox, calendar).

Full endpoint list, field-level types, and current-app file locations for cross-checking
behavior while porting are in `mirai-app/docs/FEATURES.md` §5 and §6 — keep that
doc open alongside each task rather than re-deriving contracts from scratch.

---

## Phase 0 — Foundations (infra only, no new visible features)

Everything downstream depends on this. Verify each task against the login/signup pages that already exist before moving to Phase 1.

### 0.1 HTTP client

- [ ] `src/lib/api-client.ts`: `fetch` wrapper (not axios — keeps the existing `error instanceof Error` handling in `login-form.tsx`/`signup-form.tsx` working unchanged), base URL `${import.meta.env.VITE_API_URL}/api`.
- [ ] Add `.env.example` with `VITE_API_URL`.
- [ ] Request path: attach `Authorization: Bearer <token>` from `localStorage` to every call except `/users/login` and `/users/register`.
- [ ] `ApiError extends Error` class: `.message` = `body.title` (ProblemDetails `{ type, title, status, traceId }`), `.status` = HTTP status.
- [ ] Response path: on `401`, toast "session expired", clear `localStorage`, redirect to `/login`.
- [ ] Support per-call header overrides (needed later for Tag Import Jobs' `accept: application/vnd.mirai.hateoas+json`).
- [ ] Update `vite.config.ts` dev proxy target to read Aspire service-discovery env vars (`services__mirai-api__https__0` / `...http__0`), fallback to current hardcoded `https://localhost:5000`.

### 0.2 Types

- [ ] Port `src/types/*.ts` from `mirai-app` into `mirai-react-app/src/types/`, one file per domain: `boards`, `dashboards`, `organizations`, `personas`, `projects`, `retrospectives`, `sprints`, `tags`, `tag-import-jobs`, `teams`, `wiki-pages`, `wisdom-extractor`, `work-items`.
- [ ] `src/types/common.ts`: `PaginatedList<T>`, `PaginationFilter`, `ApiErrorResponse`, `Comment`/`Author`, `HateoasResponse`/`Link`.
- [ ] Fix `src/types/auth.ts`: `RegisterCredentials` → `firstName`/`lastName` (not `name`) + terms acceptance boolean; add `rememberMe` to `LoginCredentials`.

### 0.3 API modules

- [ ] Rename `src/api/auth.ts` → `src/api/users.ts`, covering all `/users/*` endpoints from the catalog (`registerUser`, `loginUser`, `getCurrentUser`, `updateUserProfile`, `updateAvatar`).
- [ ] `src/api/boards.ts` — `createBoard`, `getBoard`, `listBoards`, `deleteBoard`, `moveCard`, `createColumn`, `deleteColumn`, `getColumnCards`.
- [ ] `src/api/dashboards.ts` — `getDashboardData`.
- [ ] `src/api/organizations.ts` — `createOrganization`, `listOrganizations`, `getOrganizationUsers`, `addUserToOrganization`.
- [ ] `src/api/personas.ts` — `createPersona`, `getPersona`, `listPersonas`, `updatePersona`, `deletePersona`.
- [ ] `src/api/projects.ts` — `createProject`, `getProject`, `listProjects`, `updateProject`, `deleteProject`, `getProjectUsers`, `addUserToProject`.
- [ ] `src/api/retrospectives.ts` — `createRetrospective`, `getRetrospective`, `listRetrospectives`, `createRetrospectiveItem`, `updateRetrospective`, `deleteRetrospectiveItem`, `deleteRetrospective`.
- [ ] `src/api/sprints.ts` — `createSprint`, `listSprints`, `addWorkItemToSprint`.
- [ ] `src/api/tag-import-jobs.ts` — `listTagImportJobs`, `createTagImportJob`.
- [ ] `src/api/tags.ts` — `listTags`, `createTag`, `deleteTag`, `deleteTags`, `updateTag`.
- [ ] `src/api/teams.ts` — `createTeam`, `listTeams`, `getBacklog`.
- [ ] `src/api/wiki-pages.ts` — `createWikiPage`, `updateWikiPage`, `moveWikiPage`, `getWikiPage`, `getWikiPageStats`, `listWikiPages`, `deleteWikiPage`, `addWikiPageComment`, `updateWikiPageComment`, `deleteWikiPageComment`.
- [ ] `src/api/wisdom-extractor.ts` — `extractWisdom`.
- [ ] `src/api/work-items.ts` — full catalog: `createWorkItem`, `listWorkItems`, `deleteWorkItem`, `getWorkItemsStats`, `getWorkItem`, comments CRUD, `updateWorkItem` (maps `assignee` → `assigneeId`), tags add/remove, links add/remove, attachments upload/download/delete.

### 0.4 Auth flow

- [ ] `src/lib/auth-storage.ts`: `accessToken`/`user` persistence to `localStorage`, `isTokenExpired()` (decode JWT `exp` client-side).
- [ ] `src/hooks/use-auth.ts`: wraps `getCurrentUser` as a query; `login`/`logout` actions. Login success: store token → fetch `/users/me` → store user → navigate `/`.
- [ ] Fix `login-form.tsx`: add "remember me" checkbox.
- [ ] Fix `signup-form.tsx`: `firstName`/`lastName` fields (not single `name`), terms-acceptance checkbox (`npx shadcn add checkbox`), password complexity rule (upper/lower/digit, min 8) in the zod schema.
- [ ] `src/components/protected-layout.tsx`: React Router `layout()` route wrapping authenticated routes — checks `isTokenExpired()` on mount/navigation, redirects to `/login`; redirects away from `/login`/`/signup` if already authenticated.
- [ ] Register the guard layout in `routes.ts`.
- [ ] Logout action: clear all `localStorage`, redirect to `/login`.

### 0.5 Query & loading conventions

- [ ] `src/queries/` convention doc/example: array key `[entityName, ...idsOrParams]`, `staleTime` 60s/300s per spec, `enabled` gating on parent IDs, `placeholderData` for empty states.
- [ ] `src/hooks/use-delayed-loading.ts`: 200ms delay before surfacing `isPending`/`isFetching` as a loading state, to avoid spinner flicker (used everywhere, per spec).

### 0.6 SignalR wrapper (built now, wired up in Phase 7)

- [ ] Add `@microsoft/signalr` dependency.
- [ ] `src/lib/signalr.ts`: generic connect/disconnect/on/invoke wrapper, hub URL `${VITE_API_URL}/hubs/{feature}`, WebSockets transport, `withCredentials: true`, `withAutomaticReconnect()`.
- [ ] `src/hooks/use-signalr.ts`: subscribes to named events, invalidates a given query key on receipt (no manual cache merge).

**Verification**: `pnpm dev`, exercise login/signup end-to-end against the real backend — token persisted, `/users/me` populates the sidebar user, refresh keeps session, expired/invalid token redirects to `/login`, logout clears state. `pnpm typecheck` and `pnpm lint` clean.

---

## Phase 1 — App shell & navigation

### 1.1 Routing skeleton

- [ ] Register the full route map from spec §4 in `routes.ts`, nested under `<ProtectedLayout>`.
- [ ] Org-scoped param routes (`/organizations/[organizationId]/...`) and project-scoped param routes (`/projects/[projectId]/...`).

### 1.2 Org/project context

- [ ] `src/hooks/use-organization-context.ts` — reads `organizationId` route param, drives org-level queries.
- [ ] `src/hooks/use-project-context.ts` — reads `projectId` route param, drives project-level queries.
- [ ] Replace `app-sidebar.tsx`'s hardcoded `data` object with real orgs/projects from these hooks; wire `team-switcher.tsx` to real organization list.
- [ ] Dynamic `Breadcrumb` in `root-layout.tsx` (currently hardcoded "Build Your Application / Data Fetching").

### 1.3 Search & shortcuts

- [ ] `npx shadcn add command`.
- [ ] Global search: `Command` palette toggled by topbar button or Ctrl+K, redirects to Wisdom Extractor with `?q=`.
- [ ] Keyboard shortcuts panel (`Dialog` listing shortcuts).

### 1.4 User profile

- [ ] Topbar avatar → `Sheet` with first/last name edit + avatar upload/preview (`updateUserProfile`, `updateAvatar`), unsaved-changes tracking.

### 1.5 Theme

- [ ] Keep `next-themes` dark/light/system as primary mechanism (already present) — defer PrimeVue-style multi-preset/surface-palette picker to Phase 9 polish.

**Verification**: navigate the full nav tree with a real logged-in session; sidebar/breadcrumb reflect the selected org/project; Ctrl+K opens search and redirects correctly.

---

## Phase 2 — Organizations & Projects

### 2.1 Organizations

- [ ] `/organizations` list page.
- [ ] Create-organization `Sheet` (`createOrganization`).

### 2.2 Projects

- [ ] `/organizations/[organizationId]/projects` list page.
- [ ] Create/edit-project `Sheet` drawer (`createProject`, `updateProject`).

### 2.3 Project summary

- [ ] `/projects/[projectId]/summary`: stat `Card`s from `getWorkItemsStats`, period `Select` (1/7/30 days).
- [ ] Paginated recent-members list (`getProjectUsers`).

### 2.4 Project settings

- [ ] `npx shadcn add tabs`.
- [ ] `/projects/[projectId]/settings` `Tabs`: Overview (edit project), Teams, GitHub.
- [ ] Teams tab: list teams (`listTeams`) + working "New Team" `Dialog` (`createTeam`) — built for real per decision above.
- [ ] GitHub tab: "Connect your GitHub Account" button present, no-op (stub, per decision).

### 2.5 Organization settings

- [ ] `/organizations/[organizationId]/settings` Users tab: `DataTable` (`@tanstack/react-table` + shadcn `Table`) over `getOrganizationUsers`, invite via `addUserToOrganization`.

**Verification**: create an org, create a project in it, edit project metadata, create a team from Settings → Teams and confirm it round-trips through `listTeams`.

---

## Phase 3 — Work Items (core + cross-cutting detail dialog)

Build before Boards/Backlogs/Sprints/Wisdom Extractor — they all open work items through this via `?workItemId=`.

### 3.1 List page

- [ ] `npx shadcn add table context-menu`.
- [ ] `/projects/[projectId]/work-items`: `@tanstack/react-table` + shadcn `Table`, sortable/paginated (`listWorkItems`).
- [ ] Right-click `ContextMenu` (copy, delete).

### 3.2 Shared work item detail dialog

- [ ] `npx shadcn add dialog popover`.
- [ ] `src/components/work-items/work-item-detail-dialog.tsx`, mounted once at project-layout level, opened by reading `?workItemId=` via `useSearchParams` — any page can open it by setting that query param.
- [ ] Edit title/status/value area.
- [ ] Tags add/remove (`Command`/`Popover` picker).
- [ ] Comments CRUD.
- [ ] Attachments upload/download/delete.
- [ ] Linked work items (add/remove links).
- [ ] `src/queries/work-items.ts`: shared `useDeleteWorkItem` mutation hook, used by **both** the list's context menu and the dialog's overflow menu (standardized delete, per decision).
- [ ] Overflow menu: Change Type, Create Copy, Copy Link stay disabled (spec §3, not part of the delete-standardization decision).

**Verification**: open a work item via row click and via `?workItemId=` directly in the URL; edit fields, add a comment, upload/delete an attachment; delete from both the list context menu and the dialog and confirm identical behavior.

---

## Phase 4 — Boards, Backlogs, Sprints

All team/backlog-level scoped; all reuse the Phase 3 work item dialog for card/row clicks.

### 4.1 Team context

- [ ] `src/hooks/use-team-context.ts` — team selector state, mirrors the Vue `team-context` composable.

### 4.2 Boards

- [ ] Add `@dnd-kit/core` (+ `@dnd-kit/sortable` if needed).
- [ ] `npx shadcn add card`.
- [ ] `/projects/[projectId]/boards`: Kanban via dnd-kit, shadcn `Card` columns, backlog-level selector (`getBoard`, `listBoards`).
- [ ] Column-settings `Sheet` (`createColumn`, `deleteColumn`).
- [ ] Card drag persists via `moveCard`.

### 4.3 Backlogs

- [ ] `src/components/common/tree.tsx`: shared Collapsible-based tree component (reused by Wiki Pages in Phase 6 — no separate headless-tree dependency).
- [ ] `/projects/[projectId]/backlogs`: hierarchical tree by backlog level, team-scoped (`getBacklog`).

### 4.4 Sprints

- [ ] `npx shadcn add select dialog`.
- [ ] `/projects/[projectId]/sprints`: team/sprint `Select` (auto-selects first sprint via `listSprints`).
- [ ] "Create Sprint" `Dialog` (`createSprint`).

**Verification**: drag a card between board columns and confirm `moveCard` persists across reload; confirm backlog tree and sprint board both open work items through the shared dialog.

---

## Phase 5 — Dashboards (Analytics)

- [ ] Add `recharts`.
- [ ] `/projects/[projectId]/dashboards`: Burndown, Burnup, Cycle Time, Lead Time, Velocity charts from `getDashboardData`.
- [ ] Team selector, date-range display.
- [ ] `Skeleton` loading states per chart.
- [ ] "Dashboard Settings"/"Copy Dashboard" menu items present but disabled (stub, no backend support).

**Verification**: switch teams and confirm all five charts refetch and render with real data.

---

## Phase 6 — Personas, Tags, Wiki Pages

### 6.1 Personas

- [ ] `/projects/[projectId]/personas`: `Card` grid (`listPersonas`), empty-state illustration.
- [ ] "New Persona" `Sheet`: multipart name/description/image (`createPersona`).

### 6.2 Tags

- [ ] `npx shadcn add badge`.
- [ ] `/projects/[projectId]/tags`: CRUD `Table` with inline-editable cells (`listTags`, `createTag`, `updateTag`).
- [ ] Color `Popover` picker.
- [ ] Multi-select bulk delete (`deleteTags`).

### 6.3 Tag import

- [ ] `/projects/[projectId]/tags/import`: CSV upload (≤10MB) → `createTagImportJob`.
- [ ] Job-status `Table` reading `listTagImportJobs` — needs `accept: application/vnd.mirai.hateoas+json` header override (from Phase 0.1) and `Link[]` pagination.
- [ ] `Badge` for job status severity.

### 6.4 Wiki Pages

- [ ] Add `@tiptap/react` + starter-kit (replaces Quill).
- [ ] `npx shadcn add alert-dialog`.
- [ ] `/projects/[projectId]/wiki-pages`: sidebar navigator reusing the Phase 4.3 `<Tree>` component (expand/collapse/select).
- [ ] `/wiki-pages/new`, `/wiki-pages/[wikiPageId]`, `/wiki-pages/[wikiPageId]/edit`: create/edit/view with Tiptap editor.
- [ ] Drag-to-reparent via dnd-kit + `moveWikiPage`.
- [ ] Delete with `AlertDialog` confirmation.
- [ ] Comments CRUD (`addWikiPageComment`, `updateWikiPageComment`, `deleteWikiPageComment`).

**Verification**: create a wiki page, drag it to reparent under another, edit content, delete with confirmation; import a tags CSV and confirm the job appears in the status table with correct pagination links.

---

## Phase 7 — Retrospectives (real-time)

- [ ] `/projects/[projectId]/retrospectives/[[retrospectiveId]]` (optional param route).
- [ ] Columns + sticky-note `Card`s.
- [ ] Create/select/delete retrospectives (`createRetrospective`, `listRetrospectives`, `deleteRetrospective`).
- [ ] Add/delete retrospective items (`createRetrospectiveItem`, `deleteRetrospectiveItem`).
- [ ] Wire Phase 0.6 `useSignalR` to hub `/hubs/retrospective`, events `send-retrospective-item`/`delete-retrospective-item` → invalidate the retrospective query key.

**Verification**: open the same retrospective in two browser sessions, add/delete an item in one, confirm it appears/disappears live in the other without a manual refresh.

---

## Phase 8 — Wisdom Extractor (AI Q&A)

- [ ] `npx shadcn add textarea`.
- [ ] `/projects/[projectId]/wisdom-extractor`: `Textarea` + submit → `extractWisdom`.
- [ ] Answer `Card` + source `Badge`/`Button` links that open the Phase 3 work item dialog via `?workItemId=`.
- [ ] Confirm Phase 1.3 global search deep-links here with `?q=` pre-filled.

**Verification**: submit a question directly and via global search; click a source link and confirm the work item dialog opens.

---

## Phase 9 — Polish & parity pass

- [ ] `/not-found`, `/oops`, catch-all → `not-found`.
- [ ] Confirm decided-stub UI is present-but-inert: GitHub tab, Pull Requests/Favorites topbar tabs, Dashboard Settings/Copy Dashboard, work item overflow menu's Change Type/Create Copy/Copy Link. No Notifications feature (none exists in current app either).
- [ ] 200ms delayed-loading-spinner (`use-delayed-loading`) actually applied across all list/detail views.
- [ ] Remove all remaining scaffold placeholder data (`nav-projects.tsx`, `team-switcher.tsx`, etc.).
- [ ] Theme configurator polish (surface palette / menu mode), if pursued.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm format` clean across the whole app.

---

## Testing (thread throughout, not a separate phase)

Mirror the current Vue app's setup: Vitest + React Testing Library for component/hook unit tests, Playwright for e2e. Add coverage incrementally per phase — each phase's "Verification" step above is the manual e2e check; add automated tests for the trickiest logic per phase (auth token expiry, the shared work item dialog's `?workItemId=` wiring, SignalR cache-invalidation, tag bulk-delete).
