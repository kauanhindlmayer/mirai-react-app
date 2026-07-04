# Testing strategy

## Context

This repo has zero test tooling today (see `docs/react-patterns-audit.md` #10) — no `vitest`/RTL config, no `*.test.*` files, `CLAUDE.md` explicitly tells contributors not to invent a test command. This doc records the chosen approach before any tooling lands, and tracks rollout so the audit item can be closed incrementally rather than in one large PR.

## Framework choice

**Vitest + React Testing Library + MSW**, not Jest:

- Vitest reuses the existing Vite pipeline (path alias, esbuild TS/JSX transform) instead of running a second bundler (`ts-jest`/babel) in parallel. Confirmed compatible: `vitest@4.1.9` supports `vite: ^6 || ^7 || ^8` (this repo is on Vite 8), and `@testing-library/react@16.3.2` supports React 19.
- React Testing Library (`@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`) for component tests — renders real DOM via jsdom, asserts on behavior, not implementation details.
- MSW (Mock Service Worker) intercepts at the network layer (Node's `http`/`https` in Vitest, not `fetch`/`axios` directly), so `queries/` hook tests exercise the *real* `api-client.ts` interceptor chain (401 handling, `ProblemDetails` → `ApiError` parsing) instead of bypassing it with a mocked axios instance.

**Not reusing `vite.config.ts`'s `reactRouter()` plugin for tests.** That plugin exists for the framework-mode route tree (route manifest, SPA build); tests render components/hooks directly, not through the router pipeline. A separate `vitest.config.ts` uses `@vitejs/plugin-react` (plain JSX/Fast Refresh transform) plus the same `@/*` alias — this is the standard pattern for testing React Router v7/v8 framework-mode apps.

## Conventions

- **Location**: co-located `*.test.ts`/`*.test.tsx` next to the source file — matches the existing "one file per domain, same name" convention across `api/`/`queries/`/`types/`. No parallel `__tests__/` tree.
- **No global test APIs**: explicit `import { describe, it, expect, vi } from "vitest"` per file. Matches this codebase's explicit-import style elsewhere and avoids adding `"vitest/globals"` to `tsconfig.app.json`'s minimal `types` array.
- **Environment**: `jsdom` project-wide. Splitting per-file (`node` for pure-logic tests) is a premature optimization at a zero-coverage baseline.
- **`src/test/setup.ts`** (Vitest `setupFiles`): registers `@testing-library/jest-dom/vitest` (extends `expect` + provides matcher types), calls RTL's `cleanup()` in `afterEach` (not automatic without `test.globals`), and starts/resets/stops the MSW server around the suite.
- **`src/test/mocks/`**: `server.ts` (`setupServer()` from `msw/node`) + `handlers.ts` (an array of per-domain request handlers, extended as domains gain tests — not pre-built for every domain up front).
- **`src/test/test-utils.tsx`**: a custom `render()` wrapping children in a fresh `QueryClientProvider` (`retry: false`, so failing-query tests don't hang) and a `MemoryRouter` — nearly every component/hook here touches `useParams`/`useSearchParams` or a `queries/` hook, so both contexts are needed almost everywhere, not just in router-specific tests.
- **Scripts**: `pnpm test` (`vitest run`, CI-friendly single pass) and `pnpm test:watch` (`vitest`, interactive). No coverage thresholds yet — introduce `@vitest/coverage-v8` reporting once a real baseline exists; gating on a % now would be arbitrary.
- No `.github/workflows` exist in this repo yet, so CI wiring is a separate follow-up once there's something worth running in CI.

## Rollout order (highest value / lowest cost first)

1. **Tooling** — install deps, `vitest.config.ts`, `src/test/` (setup, MSW harness, `test-utils.tsx`), `pnpm test`/`pnpm test:watch` scripts. Update `CLAUDE.md`'s "no test suite" line once this lands.
2. **Pure logic, no rendering** — `src/lib/auth-storage.ts` (`isAuthenticated`'s JWT-expiry decode logic), `src/lib/utils.ts` (`getErrorMessage`, `getInitials`, etc.), `src/lib/api-client.ts`'s interceptor behavior via MSW (401 → clear storage + redirect, `ProblemDetails` → single message, 204 → `undefined`). Highest-risk, zero-UI logic every query and component silently depends on.
3. **Hooks via `renderHook`** — `useDraftField` (the shared draft/commit hook — a regression here silently breaks every inline-edit field), `useWorkItemContext` (throws-outside-provider case), one representative `queries/` hook end-to-end against MSW.
4. **Components via RTL** — `ErrorState`, `inline-editable-cell.tsx` (drives `useDraftField` through real DOM blur events), `LoginPage`/`SignupPage` (validation + `clientMiddleware` redirect behavior).
5. **Defer** — `work-item-detail-dialog.tsx` (large, many sub-parts, now behind `WorkItemContext`) and `@dnd-kit`-based board columns (drag interactions are expensive to simulate credibly). Highest cost for the least coverage value at a zero-baseline stage; revisit after 2–4 land.

## Status

- [x] Step 1 — tooling (`vitest.config.ts`, `src/test/setup.ts`, `src/test/mocks/`, `src/test/test-utils.tsx`, `pnpm test`/`test:watch`/`test:coverage`)
- [x] Step 2 — pure logic (`src/lib/auth-storage.test.ts`, `src/lib/utils.test.ts`, `src/lib/api-client.test.ts` — 26 tests covering token expiry, storage round-tripping, the axios interceptor chain including 401 handling and `ProblemDetails` parsing, via MSW)
- [x] Step 3 — hooks (`src/hooks/use-draft-field.test.ts`, `src/components/work-items/work-item-context.test.tsx`, `src/queries/projects.test.tsx` — 11 tests; added `renderHookWithProviders` to `test-utils.tsx` alongside `renderWithProviders`, sharing the same `QueryClientProvider`/`MemoryRouter` wrapper builder)
- [x] Step 4 — components (`error-state.test.tsx`, `inline-editable-cell.test.tsx`, `auth-middleware.test.ts`, `login-form.test.tsx`, `signup-form.test.tsx` — 22 tests). Found and fixed two real bugs surfaced by writing these: (1) `api-client.ts`'s 401 interceptor fired unconditionally, so a wrong-password *login* attempt triggered the "session expired" redirect flow meant for expired sessions — now skipped for `PUBLIC_PATHS`; (2) both auth forms had native HTML `required` on every input alongside zod/RHF validation, so the browser's own constraint validation silently blocked submission (and the custom `FieldError` messages) on a genuinely empty form — removed `required`, letting zod be the single source of validation UX. Also fixed `signup-form.tsx`'s `handleSubmit` missing a try/catch around `mutateAsync` (present in `login-form.tsx`, absent here), which caused an unhandled rejection on failure even though the `onError` toast fired correctly. Also added a `ResizeObserver` stub to `src/test/setup.ts` (jsdom doesn't implement it; needed by Radix's `Checkbox`).
- [ ] Step 5 — deferred (dialog/board)
