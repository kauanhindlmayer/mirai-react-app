# Sprint lifecycle and carry-over (SP-1)

Builds on [SP-2](../UserStories.md) and
[mirai-api ADR 0009](https://github.com/kauanhindlmayer/mirai-api/blob/main/docs/adr/0009-sprint-editing-deletion-and-non-overlap.md),
which this feature revisits: ADR 0009 deferred any lifecycle guard on
delete/edit, and this spec supplies it. Terminology to be recorded in the
glossary and a new ADR 0010: **Sprint status**, **Committed scope**,
**Carry-over**.

## Problem Statement

A team can create, edit, and delete a sprint, but it cannot *run* one. A sprint
is just a named date range: there is no notion of a sprint being in progress, no
record of what the team committed to when it began, and no moment at which
unfinished work is dealt with. As a result the two numbers a scrum master cares
about most - what we committed to versus what we delivered - do not exist, and
velocity is computed from whatever happens to be done right now rather than from
a real commitment. Nothing distinguishes the sprint the team is actually working
in from the ones already finished or not yet begun.

## Solution

Give a sprint a lifecycle with three states - **Planned**, **Active**,
**Completed** - that a scrum master moves it through deliberately.

Starting a Planned sprint makes it the team's single Active sprint and records
its **committed scope** at that instant: a snapshot of every work item then in
the sprint, each with the story points it carried at that moment. Only one
sprint per team may be Active at a time.

Completing the Active sprint opens a carry-over step: every incomplete item
(anything not yet Closed) is listed, each defaulting to roll forward into the
next Planned sprint, with the option to send any individual item back to the
backlog instead. Completion is a single atomic act - the dispositions are
applied, the delivered figures are frozen, and the sprint becomes Completed and
read-only in one transaction. A Completed sprint keeps its delivered and removed
items as its permanent record; its committed-versus-completed figures never
change again.

The active sprint is visually distinguished in the sprint picker and is selected
by default when the sprints page loads.

## User Stories

1. As a scrum master, I want to start a Planned sprint, so that the team has a
   clearly designated sprint it is currently working in.
2. As a scrum master, I want the sprint's committed scope recorded at the moment
   I start it, so that "what we committed to" is a fixed fact rather than a
   moving number.
3. As a scrum master, I want each committed item's story points captured as they
   were at start, so that later re-estimation cannot distort the commitment.
4. As a scrum master, I want to be prevented from starting a second sprint while
   one is already active on the team, so that the team never has two sprints in
   flight.
5. As a scrum master, I want to be prevented from starting a sprint that is
   already active or already completed, so that a start is always a real
   transition.
6. As a scrum master, I want to start a sprint that currently has no work items,
   so that I can plan inside the sprint rather than being forced to fill it
   first.
7. As a scrum master, I want to complete the active sprint, so that its results
   are finalised and the team can move on.
8. As a scrum master, when I complete a sprint, I want to see every incomplete
   item in one place, so that nothing is silently abandoned.
9. As a scrum master, I want each incomplete item to default to the next Planned
   sprint, so that the common case (roll everything forward) takes the fewest
   actions.
10. As a scrum master, I want to send any individual incomplete item back to the
    backlog instead, so that work the team is no longer committing to leaves the
    sprint flow.
11. As a scrum master, I want completion to be a single atomic action, so that a
    completed sprint never contains an un-triaged incomplete item.
12. As a scrum master, I want to complete a sprint even when no next Planned
    sprint exists, so that lack of a future sprint never blocks closing the
    current one (every item then goes to the backlog).
13. As a scrum master, I want delivered (Closed) items and removed items to stay
    in the completed sprint, so that the sprint keeps an accurate historical
    record.
14. As a scrum master, I want a completed sprint's committed-versus-completed
    figures to be frozen, so that I can trust a past sprint's numbers.
15. As a scrum master, I want a completed sprint to be fully read-only, so that
    its record cannot be edited, deleted, or added to after the fact.
16. As a scrum master, I want to extend an active sprint's end date, so that a
    sprint that needs a few more days can be adjusted without being recreated.
17. As a scrum master, I want an active sprint's start date to be locked, so that
    the record of when it actually started stays honest.
18. As a scrum master, I want to rename an active sprint, so that I can fix a
    naming mistake without disrupting a sprint in flight.
19. As a scrum master, I want to add a work item to the active sprint mid-flight,
    so that genuinely new work can be taken on (recorded as scope change against
    the commitment, not folded into it).
20. As a product owner, I want velocity to count only genuinely delivered
    (Closed) work, so that the velocity chart and the sprint's completed figure
    agree on what "done" means.
21. As a scrum master, I want the active sprint visually distinguished in the
    sprint picker, so that I can tell at a glance which sprint is in progress.
22. As a scrum master, I want completed sprints marked as such in the picker, so
    that I can distinguish finished sprints from future ones.
23. As a scrum master, I want the active sprint selected by default when I open
    the sprints page, so that I land on the sprint I am most likely working with.
24. As a scrum master, I want Start offered only on a Planned sprint and Complete
    only on the active sprint, so that the available actions always match the
    sprint's state.
25. As a scrum master, I want Delete withheld once a sprint has started, so that
    a sprint with real history cannot be casually destroyed.
26. As a team member without sprint-management permission, I want the lifecycle
    actions hidden from me, so that the UI reflects what I am actually allowed to
    do (the API remains the real boundary).

## Implementation Decisions

### Domain model (mirai-api)

- **Sprint status is an explicit stored enum** `SprintStatus` = `Planned`
  (default) / `Active` / `Completed`. It is the source of truth for lifecycle
  state; deriving state from the calendar was rejected because starting and
  completing are deliberate acts, not date events. `StartedAtUtc` and
  `CompletedAtUtc` are recorded as audit, not as the state itself.
- **Deletion stays row removal**, not a fourth status. The lifecycle enum covers
  only the three running states.
- **Committed scope is a membership snapshot, not a scalar.** A new
  `SprintCommitment` entity holds one row per committed work item:
  `SprintId`, `WorkItemId`, `CommittedStoryPoints` (the item's points at start,
  nullable), `StatusAtStart`. Rows are written at Start and are immutable
  thereafter. A scalar-only commitment was rejected as a one-way door: it cannot
  later reconstruct "which items were added after start", which the sprint report
  (RP-1) will need. This matches how Jira records commitment.
- **`Team` owns the lifecycle transitions** (as it already owns `AddSprint` /
  `UpdateSprint` / `DeleteSprint`), because "one active per team" is a team-level
  invariant:
  - `StartSprint(sprintId)` - guards the sprint is `Planned` and no other sprint
    on the team is `Active`; writes the commitment snapshot; sets `Active` and
    `StartedAtUtc`.
  - `CompleteSprint(sprintId, dispositions)` - guards the sprint is `Active`;
    requires a disposition for every incomplete item; applies the moves;
    materialises the delivered figures; sets `Completed` and `CompletedAtUtc`.
  - `UpdateSprint` becomes state-aware (see gating table).
- **New domain errors:** `TeamAlreadyHasActiveSprint`, `SprintNotPlanned`,
  `SprintNotActive`, and a dispositions-incomplete error.
- **"Incomplete" = any status other than `Closed`.** `Resolved` items are
  treated as unfinished and are offered for carry-over.
- **"Delivered" = `Closed`, project-wide.** This reconciles a pre-existing
  contradiction: the velocity service counted `Closed` **or** `Resolved` as done,
  but the carry-over rule above treats `Resolved` as unfinished. The velocity
  service is changed to count `Closed` only, so velocity, the sprint report, and
  the carry-over dialog share one definition. This is a deliberate behaviour
  change (Resolved work no longer scores until Closed), safe because only test
  data exists.
- **Completed figures compare like with like.** `CompletedStoryPoints` and
  `CompletedWorkItemCount` are computed over **committed items only** (an item
  added mid-sprint and closed is scope change, not commitment delivery) and are
  measured at each item's **committed** points (not its current points). Both are
  materialised onto the sprint at completion so the report is a column read, not
  a drift-prone join. Committed figures (`CommittedStoryPoints`,
  `CommittedWorkItemCount`) are likewise materialised from the snapshot.

### Operation gating (the SP-2 revisit)

| Operation | Planned | Active | Completed |
|---|---|---|---|
| Edit name/dates | full | name + end date only (start date locked) | rejected |
| Delete | allowed | rejected | rejected |
| Add work item | allowed | allowed (scope change) | rejected |
| Start | allowed | rejected | rejected |
| Complete | rejected | allowed | rejected |

The SP-2 non-overlap invariant continues to apply to any new end date.

### Persistence & migration (mirai-api)

- Migration adds the `Status` column (existing rows default to `Planned`), the
  four figure columns, the audit timestamps, and the `SprintCommitment` table.
- A **filtered unique index** `(TeamId) WHERE Status = Active` enforces
  one-active-per-team at the database level, so a concurrent double-start cannot
  create two active sprints. The domain guard and the index are belt-and-braces.
- Existing sprints all become `Planned`; none is marked Active (which would risk
  violating the new index).

### HTTP contract (mirai-api)

State transitions are action sub-resources, not idempotent replacements:

- `POST /api/teams/{teamId}/sprints/{sprintId}/start` -> `204`, empty body.
- `POST /api/teams/{teamId}/sprints/{sprintId}/complete` -> `204`, body:
  ```json
  { "dispositions": [
      { "workItemId": "...", "target": "Backlog" },
      { "workItemId": "...", "target": "Sprint", "targetSprintId": "..." }
  ] }
  ```
  `target` is a discriminator (explicit `"Backlog"` rather than a null sprint id,
  so "send to backlog" is never confused with "no decision").
- Both commands declare `RequiredPermission => TeamManageSprints`,
  `ResourceType.Team` - the same gate as create/edit/delete; no new permission.
- New failure responses the client handles: `TeamAlreadyHasActiveSprint`,
  `SprintNotPlanned`, `SprintNotActive`, and a 400 when dispositions do not cover
  every incomplete item or reference a non-Planned target sprint.
- `SprintResponse` grows: `status`; `committedStoryPoints`,
  `committedWorkItemCount` (populated once Active/Completed); `completedStoryPoints`,
  `completedWorkItemCount` (populated once Completed); `startedAtUtc`,
  `completedAtUtc`. The existing live `workItemCount` stays, distinct from the
  frozen committed count.

### Frontend (mirai-react-app)

- `SprintStatus` is a const-object union in `types/sprints.ts` (mirroring how
  `types/roles.ts` models `Permission`); the `Sprint` type mirrors the new
  response fields.
- The `SprintPicker` shows a status `Badge` per sprint and the page selects the
  active sprint by default (falling back to the latest by end date when none is
  active).
- Start and Complete are added to the existing `SprintActionsMenu`, gated by
  state: Planned shows Start/Edit/Delete; Active shows Complete/Edit (name + end);
  Completed hides the menu entirely (read-only). All lifecycle affordances remain
  behind the `TeamManageSprints` check already used for create.
- A new `CompleteSprintDialog` lists every incomplete item, each defaulting to
  the next Planned sprint with a per-item override to the backlog, and submits all
  dispositions in one call.
- New query hooks `useStartSprintMutation` / `useCompleteSprintMutation`,
  invalidating the sprints, team-backlog, and dashboard keys on success.

## Testing Decisions

Good tests here assert observable behaviour - a start is rejected, a snapshot has
the right rows, a completed sprint's figures equal the committed points of the
closed committed items, the picker shows the right badge - never internal state.
The three seams are the ones SP-2 already established; no new seams are
introduced.

- **Domain unit tests** (`TeamTests`, `SprintTests`) are the primary seam and
  carry most of the coverage: start guards (Planned-only, one-active), the
  commitment snapshot's contents, disposition-coverage enforcement on complete,
  the completed-figure arithmetic against committed points over committed items
  only, the full state/operation gating table, and the velocity service's switch
  to `Closed`-only. Prior art: the SP-2 additions to `TeamTests` and the overlap
  tests on `SprintTests`.
- **Application integration test** covers the one thing a unit test cannot see:
  the filtered unique index actually rejecting a second Active sprint at the
  database level (the direct analogue of SP-2's foreign-key deletion test), plus
  a complete-flow round trip that moves items and freezes the figures against a
  real database. Prior art: `DeleteSprintTests`, `UpdateSprintTests`,
  `GetBacklogTests`.
- **Frontend component/page tests** (MSW at the network layer) cover the picker
  rendering and defaulting to the active sprint, the action-menu items shown per
  state, and the `CompleteSprintDialog` defaulting to the next sprint, allowing an
  item to be peeled back to the backlog, and submitting the correct dispositions.
  Prior art: `SprintsPage.test.tsx`, `delete-sprint-dialog.test.tsx`,
  `edit-sprint-dialog.test.tsx`.

## Out of Scope

- **The sprint-scoped burndown.** The story's motivation names the burndown, but
  its acceptance criteria do not require building it; the burndown stays
  team-and-date-ranged. Making it honour a sprint's dates and committed scope is
  RP-1. SP-1 makes velocity meaningful (committed scope + the `Closed` definition)
  but does not touch the burndown chart.
- **The sprint report's scope-change view** ("items added after start"). SP-1
  stores the snapshot that makes this possible but does not build the report;
  that is RP-1.
- **Auto-starting the next sprint on completion.** Completion only closes the
  current sprint; the team starts the next one deliberately, so its commitment is
  snapshotted at the right moment.
- **Notifications** on start or complete. No new notification type is added.
- **Forcing estimation.** A sprint of unestimated items may be started; it simply
  commits zero points (the committed item count remains meaningful). Capacity and
  estimation gating are a separate story (SP-4).

## Further Notes

- "Visually distinguished in every sprint picker" currently means the single
  `SprintPicker` on the sprints page; BL-2 and RP-1 are expected to add further
  sprint-selection surfaces that should adopt the same status treatment.
- ADR 0010 will record the lifecycle model, the snapshot-over-scalar decision,
  the `Closed`-as-delivered reconciliation, and the state-gated operations; it
  supersedes ADR 0009's note that delete/edit carry no lifecycle guard.
- Unlike SP-2, none of SP-1's acceptance criteria required amendment - all are
  faithfully implementable as written.
