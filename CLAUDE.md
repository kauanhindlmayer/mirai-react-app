# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Mirai's React frontend — a project management tool (agile/scrum boards, backlogs, sprints, retrospectives, wiki, work items). It's a from-scratch rewrite of a companion Vue app (`mirai-app`), targeting the same REST API (`mirai-api`, a separate ASP.NET Core repo). There is no backend code in this repo; `VITE_API_URL` (see `.env`) points at wherever `mirai-api` is running.

## Commands

```bash
pnpm start          # dev server (vite)
pnpm build          # tsc -b && vite build
pnpm typecheck      # tsc -b
pnpm lint           # eslint .
pnpm format         # prettier --write "**/*.{ts,tsx}"
pnpm preview        # preview a production build
pnpm test           # vitest run (single pass, CI-friendly)
pnpm test:watch     # vitest (interactive)
pnpm test:coverage  # vitest run --coverage
```

Test tooling (Vitest + React Testing Library + MSW) is new and coverage is still sparse — see `docs/testing-strategy-plan.md` for the framework rationale, conventions (co-located `*.test.ts(x)`, no `test.globals`, `src/test/test-utils.tsx`'s `renderWithProviders`, MSW handlers in `src/test/mocks/`), and the rollout order for what to test next. Don't assume a given file has tests just because the tooling exists — check first.

Style: no semicolons, double quotes, 80-col width, Tailwind class sorting via `prettier-plugin-tailwindcss` (see `.prettierrc`). Always run `pnpm typecheck` and `pnpm lint` after non-trivial changes — both must be clean (lint has zero tolerance for errors; a handful of pre-existing `react-hooks/incompatible-library`/`react-refresh` warnings are expected and fine).

## Architecture

### Framework mode, SPA mode — not file-based routing

React Router v8 in **framework mode** with `ssr: false` (`react-router.config.ts`), i.e. **SPA mode**: everything renders client-side, there's no runtime server. Routes are declared explicitly in `src/routes.ts` using `route()`/`layout()`/`index()` — this project deliberately does **not** use file-based routing conventions (`@react-router/fs-routes`); the explicit tree was judged more readable than encoding nesting into filenames for a route tree this shape.

**SPA-mode gotcha**: route modules must export `clientMiddleware`, not `middleware` — the plain `middleware` export is server-only and is rejected at build time with "invalid route export" in SPA mode. Auth guarding uses this: `src/lib/auth-middleware.ts` exports `requireAuth`/`redirectIfAuthenticated`, attached via `export const clientMiddleware = [...]` on `root-layout.tsx` (protected app shell) and on `LoginPage.tsx`/`SignupPage.tsx` (redirect away if already authenticated). There is no wrapping "protected layout" route — middleware replaced that, keeping the route tree one level shallower.

The work item detail view is a modal, not a route: `WorkItemDetailDialog` mounts once per project layout and opens based on `?workItemId=` in the URL (`useSearchParams`), so any page can open a work item by setting that query param rather than navigating.

### Data flow: `api/` → `queries/` → components/pages

Three parallel layers, one file per domain in each, with matching names (`boards`, `dashboards`, `organizations`, `personas`, `projects`, `retrospectives`, `sprints`, `tags`, `tag-import-jobs`, `teams`, `wiki-pages`, `work-items`, plus `users`/`wisdom-extractor`):

- **`src/api/<domain>.ts`** — thin functions calling `get`/`post`/`put`/`patch`/`del`/`delWithBody` from `src/lib/api-client.ts`. No React/query code here, just HTTP calls typed against `src/types/<domain>.ts`.
- **`src/queries/<domain>.ts`** — the only place components should call `useQuery`/`useMutation`. **Deliberately plain**, not wrapped in TanStack's `queryOptions()` — a query-key-factory helper + inline `useQuery`/`useMutation` call is enough; don't reintroduce a `queryOptions()`/`xOptions()` indirection layer. Two naming conventions to follow exactly:
  - Query hooks: `use<Entity>Query` (e.g. `useProjectQuery`, `useProjectsQuery`).
  - Mutation hooks: `use<Action><Entity>Mutation` (e.g. `useCreateProjectMutation`, `useDeleteProjectMutation`).
  - Most domains export plain `<entity>QueryKey(...)` functions (e.g. `projectsQueryKey(organizationId)`) used both inside the query hook and for `queryClient.invalidateQueries()` elsewhere — reuse these instead of retyping a key array (the ESLint `@tanstack/query/exhaustive-deps` rule enforces that every value the `queryFn`/`enabled` closes over is present in the key). Trivial single-hook domains (e.g. `dashboards.ts`) may inline the key instead.
  - Mutations use `createErrorToastHandler(message)` from `src/lib/query-helpers.ts` for `onError`. When a mutation's success behavior mixes shared cache invalidation with something component-local (closing a dialog, `form.reset()`, navigation), put only the shared invalidation in the hook's `onSuccess` and pass the local behavior via the call site's second argument: `mutation.mutate(values, { onSuccess: () => {...} })` — both fire.
- Components/pages call the `queries/` hooks only — never `api/` functions or raw `useQuery`/`useMutation` directly. This is enforced by `@tanstack/eslint-plugin-query`'s `flat/recommended` config (`exhaustive-deps`, `no-unstable-deps`, etc. are `error`; `prefer-query-options` is intentionally *not* enabled, per the plain-hooks decision above).

### HTTP client

`src/lib/api-client.ts` wraps a shared axios instance. Request interceptor attaches `Authorization: Bearer <token>` (skipping `PUBLIC_PATHS = ["/users/login", "/users/register"]`). Response interceptor turns non-2xx responses into `ApiError` (parses backend `ProblemDetails` — `title`/`detail`/`errors` — into a single message) and on 401 clears storage + toasts + hard-redirects to `/login`. Network-level failures (no `response`) propagate the raw `AxiosError` unchanged. 204 responses unwrap to `undefined`.

### Auth

Token/user persist in `localStorage` via `src/lib/auth-storage.ts` (`isAuthenticated()` decodes the JWT client-side to check expiry). `src/hooks/use-auth.ts` has `useCurrentUserQuery`, `useLoginMutation`, and `useLogout` (a plain function, not a query/mutation hook — don't rename it to match the `useXQuery`/`useXMutation` pattern). Actual route protection is the `clientMiddleware` described above, not a wrapping layout component.

### "Current selection" hooks aren't Context

`src/hooks/use-current-organization.ts` / `use-current-project.ts` / `use-current-team.ts` are plain hooks (route params + a query, or query + localStorage-persisted selection for teams) — despite the name, they're **not** `React.createContext`; each call site re-derives independently. They wrap the corresponding `queries/` hook, adding derivation logic (e.g. team selection falls back to the project's first team if the persisted id doesn't belong to it).

### Component/page organization

Both `src/components/` and `src/pages/` are split into domain subfolders matching the `api`/`queries`/`types` domains (`boards/`, `tags/`, `wiki-pages/`, etc.), plus a few cross-cutting ones: `components/layout/` (app shell — sidebar, root/project layouts, error boundary, theme), `components/auth/` (login/signup forms), `components/common/` (small shared widgets like `ErrorState`, `Tree`), `components/ui/` (shadcn primitives — see below). Pages/components with only one file for their domain stay flat at the top level rather than getting a single-file folder.

### UI primitives (shadcn)

`components.json` config: custom `radix-mira` style, `neutral` base color, no `rsc`. Add new primitives with `npx shadcn add <name>` rather than hand-rolling — it respects the aliases in `components.json` (`@/components/ui`, `@/lib/utils`, etc.).

### Shared field-editing hook

`src/hooks/use-draft-field.ts` (`useDraftField(value, onCommit)`) is the shared "local draft state, commit on blur only if changed" hook — used by the always-editable fields in `work-item-detail-dialog.tsx` and the click-to-edit `inline-editable-cell.tsx`. Reuse it for any new inline-edit UI rather than hand-rolling `useState` + blur handler again.

### Error handling

Every page-level query branches on `isError` (using `getErrorMessage(error)` from `src/lib/utils.ts`, or the `ErrorState` component from `src/components/common/error-state.tsx`) with a retry action — there is no Suspense-based fetching and no per-widget error boundaries beyond the single `RouteErrorBoundary` in `root-layout.tsx`.

### Real-time (SignalR)

`src/lib/signalr.ts` builds hub connections (`${VITE_API_URL}/hubs/{feature}` convention); `src/hooks/use-signalr.ts` (`useSignalR(hub, events)`) subscribes to named hub events and invalidates the paired TanStack Query key on receipt — the pushed payload is never merged manually, invalidation just triggers a normal refetch.

### Path alias

`@/*` → `src/*` (configured in both `vite.config.ts` and `tsconfig.app.json`) — always import via `@/...`, never deep-relative paths across domain folders.

## Code Standards

**IMPORTANT**: Follow all coding standards defined in `.claude/rules/code-standards.md`. This includes naming conventions, component structure, state management practices, and styling guidelines.

## Known gaps / in-flight priorities

`docs/react-patterns-audit.md` tracks a running audit of React-pattern inconsistencies in this codebase (some resolved, some open — check its current state rather than assuming). `docs/github-oauth-sign-in-plan.md` is a not-yet-implemented design doc for GitHub OAuth login; it also documents the current backend auth architecture (Keycloak-brokered JWT, resource-owner-password-credentials grant) that this frontend's `api-client.ts`/`auth-storage.ts` assume.
