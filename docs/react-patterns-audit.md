# React patterns audit

A snapshot of missing/inconsistent React patterns in this codebase, based on grepping actual usage (not generic advice).

1. ~~**No centralized data-access layer**~~ — **Resolved.** Every domain now has a `src/queries/<domain>.ts` module (`boards`, `dashboards`, `organizations`, `personas`, `projects`, `retrospectives`, `sprints`, `tags`, `tag-import-jobs`, `teams`, `wiki-pages`, `work-items`) built on `queryOptions()`, and all ~40 call sites across components/pages were migrated off inline `useQuery`/`useMutation`. Enforced going forward by `@tanstack/eslint-plugin-query`'s `prefer-query-options` and `exhaustive-deps` rules (`flat/recommended-strict`) — `pnpm lint` now fails if new code hand-rolls a query instead of using a `queryOptions()`-backed hook.

2. ~~**Zero error-state handling**~~ — **Resolved.** Every page-level query now branches on `isError`/`getErrorMessage` with a retry action (see `f517edc`, `e944a94`).

3. ~~**Duplicated "draft + blur-commit" logic**~~ — **Resolved** for the two files that actually matched: extracted a shared `useDraftField` hook (`src/hooks/use-draft-field.ts`), now used by `work-item-detail-dialog.tsx` (title/description/acceptanceCriteria/storyPoints/priority) and `inline-editable-cell.tsx`. Correction: `retrospective-column.tsx` doesn't actually share this pattern — it's a react-hook-form "add new item" form that closes on blur-if-empty, not a draft+commit field; the original audit misclassified it.

4. ~~**Hooks named like Context that aren't Context**~~ — **Resolved.** Renamed to `use-current-organization.ts`/`use-current-project.ts`/`use-current-team.ts` (`useCurrentOrganization`/`useCurrentProject`/`useCurrentTeam`) to drop the misleading `-context` suffix; they're still plain re-deriving hooks, just no longer implying shared subtree state.

5. ~~**Prop drilling instead of scoped Context**~~ — **Resolved.** `work-item-detail-dialog.tsx` and its 6 leaf components (comments, tags, links, attachments, assignee picker, main/meta fields) now read `projectId`/`workItemId` from a scoped `WorkItemProvider`/`useWorkItemContext` (`src/components/work-items/work-item-context.tsx`) instead of threading them as props (`8f48eae`).

6. **No Suspense-based fetching** — TanStack Query is already the data layer, but nothing uses `useSuspenseQuery`/`<Suspense>`; every consumer manually branches on `isLoading` + a skeleton.

7. **Only one error boundary** — `RouteErrorBoundary` sits once at the root layout; no per-widget boundaries, so one failing dashboard chart or panel can take down the whole page.

8. **No memoization** — zero `React.memo` usage anywhere, and only 7 files touch `useMemo`/`useCallback` at all. Not urgent yet, but the board columns, wiki tree, and work items table are the places it'll start to matter.

9. ~~**Inconsistent form strategy**~~ — **Reconsidered, not a fix.** This entry's premise (work item panel used raw `useState`) is stale: #3 already replaced that with the shared `useDraftField` hook. The remaining "inconsistency" with react-hook-form is intentional — the panel is an always-editable, autosave-per-field-on-blur UI, not a submit-the-whole-form flow, and react-hook-form's submit-oriented model doesn't fit that UX without working against the library. Not planned unless the panel's UX itself changes.

10. **No tests** — **In progress.** Tooling now exists (Vitest + React Testing Library + MSW; see `docs/testing-strategy-plan.md`) and pure-logic coverage landed for `auth-storage.ts`, `lib/utils.ts`, and `api-client.ts`'s interceptor chain (26 tests). Hooks, components, and the work item dialog/board are still untested — the strategy doc's rollout order tracks what's next.

## Suggested priority order

**Do first (cheap + high impact):**

1. ~~**#2 Zero error-state handling**~~ — done.
2. ~~**#1 Centralize data-access layer**~~ — done.
3. ~~**#4 Misnamed "-context" hooks**~~ — done.

**Do next (real maintainability payoff, moderate effort):**

4. ~~**#3 Duplicated draft+blur-commit logic**~~ — done.
5. **#7 Only one error boundary** — natural follow-on once #2 exists; contains blast radius of failures.
6. ~~**#5 Prop drilling / WorkItemContext**~~ — done.

**Lower priority / optional:**

7. **#10 No tests** — in progress; tooling + pure-logic coverage landed (see `docs/testing-strategy-plan.md`), hooks/components/dialog still to go.
8. ~~**#9 Inconsistent form strategy**~~ — reconsidered, not planned (see above).
9. **#6 No Suspense-based fetching** — bigger architectural shift with real risk; more "modernization" than fix.
10. **#8 No memoization** — no evidence yet of an actual perf problem; premature otherwise.
