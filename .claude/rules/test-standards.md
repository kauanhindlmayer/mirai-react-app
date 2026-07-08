# Test Standards

This file covers the conventions to follow when writing a new test.

## Stack

- **Vitest** as the runner, **React Testing Library** for components/hooks, **MSW** (`msw/node`) to intercept HTTP at the network layer — never mock `axios`/`api-client.ts` directly, so the real interceptor chain (auth header, 401 handling, `ProblemDetails` parsing) is exercised.
- No global test APIs: explicit `import { describe, it, expect, vi } from "vitest"` per file, not `vitest/globals`.

## File Organization

- Co-locate `*.test.ts`/`*.test.tsx` next to the file under test — no parallel `__tests__/` tree.
- One `describe` block per component/hook/function, named after it exactly (e.g. `describe("useDraftField", ...)`, `describe("OrganizationsPage", ...)`).
- `it` descriptions are full sentences in the present tense describing behavior, not implementation (e.g. `"shows an empty-state message when there are no organizations"`, not `"sets isEmpty to true"`).

## Rendering

- Use `renderWithProviders` / `renderHookWithProviders` from `@/test/test-utils` (wraps `QueryClientProvider` + `MemoryRouter`) instead of RTL's bare `render`/`renderHook` — nearly everything touches a route param or a `queries/` hook. Bare `render` is only acceptable for a component with zero router/query dependency (e.g. `ErrorState`).
- For a component that reads a route param via `useParams`, don't rely on the `route` option alone — wrap it in a real `<Routes><Route path="..." element={...} /></Routes>` passed as the `ui` argument, with the matching path given to `renderWithProviders`'s `route` option. `useParams` returns empty otherwise.
- For a hook or component whose behavior doesn't depend on the specifics of a "current selection" hook (`use-current-project`, `use-current-organization`, `use-current-team`), mock it directly with `vi.mock("@/hooks/use-current-x", () => ({ useCurrentX: () => ({ ... }) }))` rather than standing up real route matching just to satisfy it.

## Mocking network requests

- Register handlers per-test with `server.use(...)` inside the `it`, not globally in `src/test/mocks/handlers.ts` — that file stays empty until a handler is genuinely shared across many tests.
- Match request URLs with a leading wildcard: `http.get("*/api/organizations", ...)` — the base URL varies, only the path matters.
- Prefer returning real response shapes over minimal stubs; build helper functions (e.g. `buildWikiPage(overrides)`) for domain objects reused across a file's tests rather than repeating an inline object.
- To assert a request was/wasn't made, pass `vi.fn()` as the handler and assert on it, rather than asserting global state.
- FormData request bodies cannot be intercepted by MSW under jsdom (confirmed independently of any component code — a bare `fetch` + `FormData` hangs). For a mutation with a `FormData` body (file uploads), mock the `queries/` hook directly with `vi.mock(...)` and assert the component calls `.mutate()` with the right argument, instead of exercising a real network round trip.

## Mocking `react-router`

- To assert a navigation call, mock only `useNavigate`, keeping everything else real:
  ```ts
  vi.mock("react-router", async (importOriginal) => {
    const actual = await importOriginal<typeof import("react-router")>()
    return { ...actual, useNavigate: vi.fn() }
  })
  ```
  then in a `beforeEach`, `vi.mocked(useNavigate).mockReturnValue(navigate)` where `navigate = vi.fn()` is declared at module scope and `.mockClear()`'d each test.

## Auth in tests

- `localStorage.clear()` in a `beforeEach` — tokens persist across tests otherwise.
- To simulate a signed-in user, write a real (fake-signed) JWT via `setAccessToken` from `@/lib/auth-storage` and mock `GET /users/me` via MSW, rather than mocking `useCurrentUserQuery` or `isAuthenticated()` directly — this exercises the real `enabled: isAuthenticated()` gating.

## Assertions

- Query by role and accessible name first (`getByRole("button", { name: /save/i })`), then by text; avoid `getByTestId` and CSS-selector-based queries.
- Use `findBy*`/`waitFor` for anything behind a query or mutation; never wrap an assertion in `act()` to silence a warning instead of awaiting the real async work.
- When two elements share an accessible name (e.g. an `AlertDialogTrigger` and its `AlertDialogAction`, both "Delete"), use `getAllByRole` and index into the result rather than adding a test-only selector or `data-testid`.
- Assert user-visible outcomes (rendered text, navigation calls, request bodies) over internal state or implementation details.

## jsdom gaps

`src/test/setup.ts` stubs browser APIs jsdom doesn't implement, added as new components need them (`ResizeObserver` for Radix `Checkbox`, `scrollIntoView` for `cmdk`'s `Command`). If a test fails with a "not implemented" error from jsdom for a real browser API, add the stub there rather than working around it per-test.

## What not to do

- Don't test the `components/ui/` shadcn primitives themselves — they're generated code, exempt like elsewhere in this codebase.
- Don't chase coverage on `@dnd-kit` drag interactions or the large `work-item-detail-dialog.tsx` before simpler, isolated components are covered — expensive to simulate credibly for low marginal value at a low-baseline stage.
- Don't add a loading-skeleton assertion for a query using `placeholderData` — `isLoading` is `false` from the first render in that case (TanStack Query treats placeholder data as an immediate `success` status), so that branch is unreachable and asserting it is testing dead code.
