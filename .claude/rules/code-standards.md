# Code Standards

## Naming Conventions

- All source code must be written in English
- Use PascalCase for:
  - React component names (function names), regardless of file name casing
  - TypeScript types and enums
  - Page file names, always suffixed with `Page` (e.g., `BoardsPage.tsx`, `ProjectSettingsPage.tsx`)
- Use camelCase for:
  - Variables, functions, and method names
  - Hook function names (prefixed with `use`, e.g., `useCurrentProject`, `useDraftField`)
  - Props and object properties
- Use kebab-case for:
  - File names for components, hooks, api/queries/types modules, and lib utilities (e.g., `board-card.tsx`, `use-current-project.ts`)
  - Directory names
  - CSS custom properties
- Prefix boolean variables and props with `is`/`has`/`should` (e.g., `isLoading`, `hasError`)
- Query hooks: `use<Entity>Query` / `use<Entity>sQuery` (e.g., `useProjectQuery`, `useProjectsQuery`)
- Mutation hooks: `use<Action><Entity>Mutation` (e.g., `useCreateProjectMutation`, `useDeleteProjectMutation`)
- Query key factories: `<entity>QueryKey` / `<entity>sQueryKey`, reused both in the hook and at `invalidateQueries` call sites — never hand-roll a duplicate key array
- Avoid abbreviations, but also don't write names longer than 30 characters

## Code Quality

- Declare constants to represent magic numbers and strings for readability
- Functions should perform a clear and well-defined action, reflected in their name, which should start with a verb
- Prefer explicit typing over `any` or implicit types
- Use TypeScript strict mode features
- Use `type` for all type definitions (props, domain models, unions) — this codebase does not use `interface`

## Function Design

- Whenever possible, avoid passing more than 3 parameters; prefer a single options object for anything beyond that
- Never nest more than two if/else statements; always prefer early returns
- Never use boolean parameters to switch function behavior; extract to specific functions instead
- Prefer pure functions; keep side effects (mutations, API calls) explicit and isolated to event handlers, mutation `mutationFn`s, or effects
- Extract complex stateful logic into a dedicated hook (`src/hooks/`) instead of growing a component

## Component Structure

- Keep components under 200 lines; extract sub-components (in the same file, if only used locally, or a new file otherwise) when needed
- Use function declarations for components — `export function BoardCard(...)` for components, `export default function BoardsPage(...)` for pages — not arrow-function consts (the `components/ui/` shadcn primitives are generated code and are exempt from this)
- Type props with a local `type <ComponentName>Props = { ... }` declared just above the component
- Structure a component's body in this order:
  1. Hooks: routing (`useParams`, `useSearchParams`), queries/mutations, other custom hooks, local state (`useState`)
  2. Derived values computed from that state (plain `const`, not memoized unless proven expensive)
  3. Event handlers
  4. Effects (`useEffect`), if unavoidable
  5. `return` JSX
- One component per file as the primary export; small tightly-coupled sub-components (e.g., a card's internal body) may live in the same file as private, non-exported functions

## React-Specific Standards

- No default `React` import is needed (automatic JSX runtime)
- Prefer deriving values during render over `useEffect` + state; reach for `useEffect` only for real synchronization with something outside React (subscriptions, imperative DOM APIs, SignalR)
- Always provide a stable, meaningful `key` in list rendering — never the array index unless the list is static and never reordered
- Use optional chaining (`?.`) and nullish coalescing (`??`) over manual null checks
- "Current selection" hooks (`use-current-project.ts` and similar) are plain hooks, not Context — each call site re-derives from route params/query data independently; don't convert them to Context providers
- Route protection goes through `clientMiddleware` (see `src/lib/auth-middleware.ts`), never a wrapping "protected layout" component

## Code Style

- No semicolons, double quotes, 80-column width — enforced by Prettier (`.prettierrc`), don't hand-format against it
- Avoid using comments whenever possible; let code be self-documenting. When a comment is needed, it should explain *why*, not *what*
- Never declare more than one variable on the same line
- Declare variables as close as possible to where they will be used
- Use destructuring for props, hook returns, and query results
- Prefer template literals over string concatenation
- Blank lines inside a function are fine to separate logical groups (e.g., derived state from handlers) — don't compress everything into one block

## File Organization

- Follow the established domain split: one file per domain, same name, across `src/api/`, `src/queries/`, and `src/types/` (e.g., `projects.ts` in all three)
- `src/api/<domain>.ts` — thin HTTP functions only (`get`/`post`/`put`/`patch`/`del` from `src/lib/api-client.ts`), no React or query code
- `src/queries/<domain>.ts` — the only place `useQuery`/`useMutation` are called; plain hooks, not wrapped in `queryOptions()`
- `src/components/<domain>/` and `src/pages/<domain>/` mirror the same domain names; a domain with a single file stays flat instead of getting a one-file folder
- Components/pages must call `queries/` hooks only — never `api/` functions or raw `useQuery`/`useMutation` directly
- Always import via the `@/` alias (`@/components/...`, `@/hooks/...`) — never deep-relative paths across domain folders

## State Management

- Use TanStack Query (via `src/queries/`) for all server state; do not introduce a separate client-state store (Redux/Zustand/Context) for data that belongs to the API
- Keep component-local UI state in `useState`/`useReducer`
- Share stateful logic between components via a custom hook, not Context, unless the state must cross more than a couple of unrelated component subtrees
- Mutations report errors via `createErrorToastHandler(message)` (`src/lib/query-helpers.ts`) in `onError`; put shared cache invalidation in the hook's `onSuccess`, and pass component-local success behavior (closing a dialog, resetting a form) through the call site's second argument to `mutate()`

## Styling Standards

- Use TailwindCSS utility classes for styling; this project has no SCSS/CSS-in-JS layer
- Use `cn()` (`src/lib/utils.ts`) to merge/conditionally apply classes, and `cva()` for component style variants — both are registered with `prettier-plugin-tailwindcss` for class sorting, don't fight the sort order
- Add new UI primitives with `npx shadcn add <name>` rather than hand-rolling — it respects the aliases in `components.json`
- Avoid inline `style` props; the only accepted exception is passing computed values to a library that requires it (e.g., `@dnd-kit`'s `transform`/`transition`)
