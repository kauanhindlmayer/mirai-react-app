# React patterns audit

A snapshot of missing/inconsistent React patterns in this codebase, based on grepping actual usage (not generic advice).

1. ~~**No centralized data-access layer**~~ — **Resolved.** Every domain now has a `src/queries/<domain>.ts` module (`boards`, `dashboards`, `organizations`, `personas`, `projects`, `retrospectives`, `sprints`, `tags`, `tag-import-jobs`, `teams`, `wiki-pages`, `work-items`) built on `queryOptions()`, and all ~40 call sites across components/pages were migrated off inline `useQuery`/`useMutation`. Enforced going forward by `@tanstack/eslint-plugin-query`'s `prefer-query-options` and `exhaustive-deps` rules (`flat/recommended-strict`) — `pnpm lint` now fails if new code hand-rolls a query instead of using a `queryOptions()`-backed hook.

2. ~~**Zero error-state handling**~~ — **Resolved.** Every page-level query now branches on `isError`/`getErrorMessage` with a retry action (see `f517edc`, `e944a94`).

3. ~~**Duplicated "draft + blur-commit" logic**~~ — **Resolved** for the two files that actually matched: extracted a shared `useDraftField` hook (`src/hooks/use-draft-field.ts`), now used by `work-item-detail-dialog.tsx` (title/description/acceptanceCriteria/storyPoints/priority) and `inline-editable-cell.tsx`. Correction: `retrospective-column.tsx` doesn't actually share this pattern — it's a react-hook-form "add new item" form that closes on blur-if-empty, not a draft+commit field; the original audit misclassified it.

4. ~~**Hooks named like Context that aren't Context**~~ — **Resolved.** Renamed to `use-current-organization.ts`/`use-current-project.ts`/`use-current-team.ts` (`useCurrentOrganization`/`useCurrentProject`/`useCurrentTeam`) to drop the misleading `-context` suffix; they're still plain re-deriving hooks, just no longer implying shared subtree state.

5. **Prop drilling instead of scoped Context** — `work-item-detail-dialog.tsx` threads `projectId`/`workItemId` through 5+ layers (comments, tags, links, attachments, assignee picker) that could sit under one `WorkItemContext`.

6. **No Suspense-based fetching** — TanStack Query is already the data layer, but nothing uses `useSuspenseQuery`/`<Suspense>`; every consumer manually branches on `isLoading` + a skeleton.

7. **Only one error boundary** — `RouteErrorBoundary` sits once at the root layout; no per-widget boundaries, so one failing dashboard chart or panel can take down the whole page.

8. **No memoization** — zero `React.memo` usage anywhere, and only 7 files touch `useMemo`/`useCallback` at all. Not urgent yet, but the board columns, wiki tree, and work items table are the places it'll start to matter.

9. **Inconsistent form strategy** — react-hook-form + zod is the norm (13 files), but the work item detail panel manages every field with raw `useState`, so validation/dirty-tracking works differently there than everywhere else.

10. **No tests** — zero `*.test.*`/`*.spec.*` files, so none of the above has a regression safety net if addressed.

## Suggested priority order

**Do first (cheap + high impact):**
1. ~~**#2 Zero error-state handling**~~ — done.
2. ~~**#1 Centralize data-access layer**~~ — done.
3. ~~**#4 Misnamed "-context" hooks**~~ — done.

**Do next (real maintainability payoff, moderate effort):**
4. ~~**#3 Duplicated draft+blur-commit logic**~~ — done.
5. **#7 Only one error boundary** — natural follow-on once #2 exists; contains blast radius of failures.
6. **#5 Prop drilling / WorkItemContext** — worth doing, but the dialog works today, so it's cleanup rather than a fix.

**Lower priority / optional:**
7. **#10 No tests** — normally ranked much higher, but there's no test tooling in this repo yet (no vitest/RTL config), so it's a bigger up-front investment than the others. Worth doing before leaning on it as a safety net for the refactors above, not after.
8. **#9 Inconsistent form strategy** — cosmetic consistency, current approach isn't broken.
9. **#6 No Suspense-based fetching** — bigger architectural shift with real risk; more "modernization" than fix.
10. **#8 No memoization** — no evidence yet of an actual perf problem; premature otherwise.
