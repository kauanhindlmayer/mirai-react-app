# Backlog

A gap analysis of Mirai against Jira and Azure DevOps (Boards), and the resulting product backlog.

Every item below was checked against what actually exists in this repo today (`src/types/`, `src/api/`, `src/routes.ts`) rather than against an idea of what the product does.
"Mirai today" lines cite the concrete code that constrains the feature, so an item can be picked up without re-deriving the current state.

Mirai already has several things that are strong and are not repeated below: retrospectives, personas, a wiki with comments and mentions, tag import jobs, a semantic "wisdom extractor", GitHub pull request linking, a permission model with organization/project/team scopes, and SignalR-backed live notifications.
The gaps are concentrated in **planning at scale, querying, process configurability, and reporting** - which is precisely where Jira and Azure DevOps have twenty years of accumulated surface area.

## Legend

- **Priority** - P0 (blocks credible adoption by a real team), P1 (expected by anyone coming from Jira/ADO), P2 (differentiator or long tail).
- **API** - "yes" means the gap cannot be closed in this repo alone and needs `mirai-api` work first.

---

## 1. Work item model and fields

The work item is the core entity and is currently the thinnest part of the product relative to competitors.
`WorkItem` in `src/types/work-items.ts` carries title, description, acceptance criteria, story points, priority (a bare number), value area, one assignee, tags, parent/child, links, attachments, and comments.
That is roughly the Jira issue of 2010.

### WI-1 - Dates: due date, start date, target date

**Jira/ADO:** every issue has a due date; ADO adds start/target dates on Epics and Features, which drive the roadmap and delivery plans.
**Mirai today:** no date field of any kind on `WorkItem` - only `createdAtUtc`/`updatedAtUtc`.
**Proposal:** add `startDate`, `dueDate` to `Planning`, surface them in `work-item-detail-dialog.tsx`, show overdue state on board cards and in the work items table.
This is a prerequisite for roadmaps (PL-1) and for any "what is late" reporting.
**Priority:** P0 · **API:** yes

### WI-2 - Time tracking and effort

**Jira/ADO:** original estimate, remaining work, completed work, plus Jira work logs ("logged 3h against this issue").
**Mirai today:** `storyPoints` only.
Teams that bill hours or run capacity-based sprints cannot use Mirai at all.
**Proposal:** add effort fields to `Planning` and a work-log sub-resource on the work item, mirroring the comments sub-resource.
Keep story points as the default estimation unit and treat time tracking as opt-in per project (see PC-1).
**Priority:** P1 · **API:** yes

### WI-3 - Priority as a real scale, and bug severity

**Jira/ADO:** priority is a named, ordered, colour-coded scale (Highest…Lowest / 1-4); bugs additionally carry a severity, and ADO bugs carry structured repro steps and system info.
**Mirai today:** `Planning.priority` is an untyped `number`, rendered as a raw number with no semantics, no colour, and no sort affordance.
**Proposal:** promote priority to a typed enum with colours (reuse the `WORK_ITEM_STATUS_COLORS` pattern in `src/lib/work-item-colors.ts`), add `severity` and `reproSteps` to the Bug/Defect types.
**Priority:** P1 · **API:** yes

### WI-4 - Reporter, watchers, and multiple assignees

**Jira/ADO:** issues have a reporter distinct from the assignee, and a watcher list that drives notification fan-out.
**Mirai today:** a single optional `assigneeId`, and no watcher concept.
Notifications can therefore only ever reach the assignee and people explicitly @-mentioned - there is no way to follow an item you care about.
**Proposal:** add `reporter` (defaulting to the creator) and a watch/unwatch action, then extend `NotificationType` with `WatchedWorkItemChanged`.
**Priority:** P1 · **API:** yes

### WI-5 - Work item templates

**Jira/ADO:** issue templates and ADO work item templates pre-fill fields for recurring kinds of work (a bug triage template, a release checklist).
**Mirai today:** `CreateWorkItemRequest` accepts only `title`, `type`, `assignedTeamId`; everything else is filled in afterwards, one field at a time.
**Proposal:** project-scoped templates that seed description, acceptance criteria, tags, and default assignee.
**Priority:** P2 · **API:** yes

### WI-6 - Clone, and move between projects

**Jira/ADO:** both support cloning an issue and moving it to another project or board, preserving history.
**Mirai today:** neither exists; a mis-filed work item must be recreated by hand.
**Proposal:** "Clone" and "Move to project" actions in the work item detail dialog's overflow menu.
**Priority:** P2 · **API:** yes

### WI-7 - Human-readable work item keys

**Jira/ADO:** `PROJ-123`.
The key is quotable in Slack, in a commit message, and in a branch name.
**Mirai today:** `WorkItem.code` is a bare integer, scoped per project, so "#42" is ambiguous across projects and unusable in a commit message.
**Proposal:** add a short project key (2-10 chars, set at project creation) and render `KEY-code` everywhere `code` is shown today.
This also unlocks smart commits (IN-2).
**Priority:** P1 · **API:** yes

---

## 2. Querying, filtering, and bulk operations

This is the single largest capability gap.
Jira has JQL and Azure DevOps has WIQL; both let a user express "unresolved bugs assigned to me in the current sprint, ordered by priority", save it, share it, and pin it to a dashboard.

### QF-1 - Filtering on the work items list

**Jira/ADO:** every list view filters by type, status, assignee, tag, sprint, priority.
**Mirai today:** `WorkItemsPage.tsx` supports pagination and single-column sort, and nothing else.
`listWorkItems` accepts only `page`, `pageSize`, `sort`, `q`.
**Proposal:** a filter bar (type, status, assignee, tag) backed by new query parameters, with the filter state kept in the URL so views are linkable.
**Priority:** P0 · **API:** yes

### QF-2 - Saved and shared queries

**Jira/ADO:** saved filters are the backbone of daily work - "My open bugs", "Team triage queue" - and they are shareable and pinnable.
**Mirai today:** does not exist in any form.
**Proposal:** persist a named filter (owner, project, shared flag, filter payload) and list saved queries in the sidebar.
Depends on QF-1.
**Priority:** P1 · **API:** yes

### QF-3 - Bulk edit and multi-select

**Jira/ADO:** select N issues, then change status, assignee, sprint, or tags on all of them in one action.
**Mirai today:** every mutation in `src/api/work-items.ts` is single-item; triaging 30 items means 30 dialogs.
**Proposal:** row selection in `work-items-table.tsx` (TanStack Table already supports it) plus a bulk-action bar and batch endpoints.
**Priority:** P1 · **API:** yes

### QF-4 - Global search that is actually global

**Jira/ADO:** search spans projects, and covers issues, comments, and wiki/Confluence pages, with filters in the results panel.
**Mirai today:** `global-search.tsx` searches work items in the *current project only* (it early-returns without `projectId`), capped at 5 results, and does not search wiki pages, comments, or other projects.
**Proposal:** a cross-project search endpoint spanning work items and wiki pages, with a full results page behind the ⌘K palette.
The wisdom extractor already proves the semantic-search infrastructure exists.
**Priority:** P1 · **API:** yes

### QF-5 - Export to CSV/Excel

**Jira/ADO:** any query result exports.
This is how stakeholders who will never log in get their reports.
**Mirai today:** nothing exports.
**Proposal:** export the current (filtered) work item query to CSV client-side.
Cheap once QF-1 lands, and does not require API work.
**Priority:** P2 · **API:** no

---

## 3. Boards

`BoardsPage.tsx` gives one board per team, columns with WIP limits and a definition of done, drag-and-drop between columns, and a backlog-level switch.
That is a solid core; what is missing is everything that makes a board usable when it has more than 40 cards.

### BD-1 - Board filters and quick filters

**Jira/ADO:** filter the board by assignee, tag, type, or a saved quick filter; an avatar row lets you click a person to see only their cards.
**Mirai today:** no filtering on the board at all - only the board picker and the backlog-level select.
**Proposal:** an assignee avatar row plus type/tag filters, applied client-side over the already-fetched columns where possible.
**Priority:** P0 · **API:** partial

### BD-2 - Swimlanes

**Jira/ADO:** group board rows by epic, assignee, or priority.
Essential for a board that serves more than one workstream.
**Mirai today:** columns only; `Column.cards` is a flat list.
**Proposal:** a swimlane grouping selector (by parent epic / assignee / none) applied over the existing card data.
**Priority:** P1 · **API:** partial

### BD-3 - Column-to-status mapping

**Jira/ADO:** a board column is *mapped* to one or more workflow states, so moving a card is what changes the issue's state.
**Mirai today:** `Column` and `WorkItemStatus` are independent - a column has a name and a position, and `moveCard` does not touch the work item's status.
A card can sit in a column named "Done" while its work item status says `Active`, with nothing reconciling the two.
This is a correctness problem, not just a feature gap.
**Proposal:** give each column a mapped status, and have card moves transition the work item.
**Priority:** P0 · **API:** yes

### BD-4 - Card customization and board polish

**Jira/ADO:** choose which fields appear on a card; cards show blocked/flagged state and due-date warnings.
**Mirai today:** `board-card.tsx` renders a fixed set (code, title, story points, assignee, type, tags).
**Proposal:** a per-board card field selection in `board-settings-sheet.tsx`, plus a blocked/flag indicator.
**Priority:** P2 · **API:** partial

---

## 4. Backlogs and ranking

### BL-1 - Drag-to-rank the backlog

**Jira/ADO:** the backlog is an *ordered* list; dragging an item up is how a product owner expresses priority, and that order is what the board and sprint planning read from.
**Mirai today:** `getBacklog` returns a tree with no rank/order field, and `SprintsPage`/`BacklogsPage` render a read-only `Tree`.
There is no way to express "this is the next most important thing".
**Proposal:** a persisted rank on the work item, drag-to-reorder in the backlog (dnd-kit is already a dependency), and rank as the default sort everywhere.
**Priority:** P0 · **API:** yes

### BL-2 - Drag from backlog into a sprint

**Jira/ADO:** sprint planning is a two-pane drag: backlog on one side, sprint on the other, with a running total of estimated points against capacity.
**Mirai today:** `addWorkItemToSprint` exists in the API layer, but the backlog UI offers no way to invoke it, and there is no `removeWorkItemFromSprint` at all.
**Proposal:** a sprint-planning view with drag between backlog and sprint, plus the missing remove endpoint.
**Priority:** P0 · **API:** yes

### BL-3 - Inline edit in the backlog

**Jira/ADO:** edit estimate, assignee, and status directly in the backlog row.
**Mirai today:** the backlog tree is read-only; you must open the work item dialog.
**Proposal:** reuse `use-draft-field.ts` and `inline-editable-cell.tsx`, which already implement exactly this pattern for tags.
**Priority:** P2 · **API:** no

---

## 5. Sprints and capacity

`Sprint` is `{ id, name, startDate, endDate }`, and the API exposes only create, list, and add-work-item.
There is no update, no delete, no goal, no state.

### SP-1 - Sprint lifecycle: start, complete, and carry-over

**Jira/ADO:** a sprint is future/active/closed; completing a sprint prompts you to move incomplete items to the next sprint or back to the backlog, and that ceremony is what makes velocity meaningful.
**Mirai today:** sprints have no state field and no lifecycle at all; they are date ranges.
Nothing distinguishes the active sprint, and nothing happens at the boundary.
**Proposal:** add a sprint state, a "Start sprint"/"Complete sprint" flow, and a carry-over dialog listing incomplete items.
**Priority:** P0 · **API:** yes

### SP-2 - Edit and delete a sprint

**Mirai today:** `src/api/sprints.ts` has `createSprint`, `listSprints`, `addWorkItemToSprint` - and nothing else.
A sprint created with the wrong dates is permanent.
**Proposal:** the missing update and delete endpoints, plus the UI to reach them.
Small, and embarrassing to be missing.
**Priority:** P0 · **API:** yes

### SP-3 - Sprint goal

**Jira/ADO:** a one-line sprint goal, shown at the top of the board and in the sprint report.
**Mirai today:** no such field.
**Proposal:** add `goal` to `Sprint` and display it on the board and sprint views.
**Priority:** P1 · **API:** yes

### SP-4 - Capacity planning and days off

**ADO:** per-person capacity in hours/day, team days off, and a capacity bar that turns red when a person is over-allocated.
**Jira:** the same via team velocity and estimates.
**Mirai today:** nothing; there is no way to know whether a sprint is over-committed until it fails.
**Proposal:** per-sprint, per-member capacity, with an allocation bar in the sprint planning view.
Depends on WI-2 (effort) to be meaningful in hours, or on story points as a proxy.
**Priority:** P1 · **API:** yes

### SP-5 - Iteration hierarchy

**ADO:** iteration paths nest (`Release 1 > Sprint 3`), so a Feature can be planned to a release while its stories sit in sprints.
**Mirai today:** sprints are a flat list per team.
**Proposal:** allow a parent iteration, or defer in favour of Releases (PL-2), which covers most of the same need more simply.
**Priority:** P2 · **API:** yes

---

## 6. Planning at scale

### PL-1 - Roadmap / timeline / delivery plan

**Jira:** Advanced Roadmaps.
**ADO:** Delivery Plans.
Both give a Gantt-style timeline of epics and features across teams, with dependency arrows.
This is the view executives actually look at.
**Mirai today:** does not exist; the epic/feature hierarchy is only ever shown as an indented tree.
**Proposal:** a timeline view over Epics and Features using their start/target dates (depends on WI-1), grouped by team, with dependency lines drawn from the existing `Predecessor` work item links.
This is the highest-leverage differentiating feature in this document - the data model is already 80% there.
**Priority:** P1 · **API:** partial

### PL-2 - Releases / versions

**Jira:** fix versions and a release page showing what shipped and what slipped.
**Mirai today:** no concept of a release.
**Proposal:** a project-scoped Release entity, a `fixVersion` on the work item, and a release page with a completion bar.
**Priority:** P2 · **API:** yes

### PL-3 - Dependency and blocker visualisation

**Jira/ADO:** blocked-by relationships surface as a warning on the card and as arrows on the roadmap.
**Mirai today:** `WorkItemLinkType` has `Related`, `Affects`, `Predecessor`, `Duplicate` - but no `Blocks`/`BlockedBy`, and links are rendered only as a flat list inside the detail dialog.
Nothing warns you that an item is blocked.
**Proposal:** add the blocking link type, a blocked badge on board cards, and dependency arrows on the roadmap.
**Priority:** P1 · **API:** yes

---

## 7. Reporting and dashboards

`ProjectDashboardsPage` renders a fixed set of five charts (burnup, burndown, velocity, cycle time, lead time) from a single `DashboardResponse`.
It is a good foundation and a bad dashboard: nothing is configurable, nothing is scoped to a sprint, and nothing can be shared.

### RP-1 - Sprint-scoped reports

**Jira/ADO:** the burndown is *per sprint*, and the sprint report shows committed vs completed.
**Mirai today:** `getDashboard` takes a date range, not a sprint; there is no sprint report and no committed-vs-completed comparison.
**Proposal:** scope the dashboard queries by sprint, and add a sprint report to the sprint view.
Depends on SP-1 for "committed" to have a meaning.
**Priority:** P0 · **API:** yes

### RP-2 - Cumulative flow diagram

**Jira/ADO:** the CFD is the single best diagnostic for a stuck workflow, and it is the most conspicuous omission from the current chart set.
**Mirai today:** absent.
**Proposal:** a CFD from work item status history, which `WorkItemChangeSet` already records.
**Priority:** P1 · **API:** yes

### RP-3 - Configurable dashboards

**Jira/ADO:** add, remove, resize, and arrange widgets; multiple dashboards per project; pin a saved query as a widget.
**Mirai today:** one hard-coded page, one layout, for everyone.
**Proposal:** a widget registry and a persisted per-user dashboard layout.
Pairs with QF-2 (a saved query becomes a widget).
**Priority:** P2 · **API:** yes

### RP-4 - Epic and release burndown

**Jira/ADO:** progress against an epic, not just a sprint.
**Mirai today:** absent.
**Proposal:** roll story points up the parent/child hierarchy and chart completion per epic.
**Priority:** P2 · **API:** yes

---

## 8. Process configuration and automation

Jira and ADO are, underneath the UI, configurable workflow engines.
Mirai is currently a fixed one.

### PC-1 - Custom statuses and workflows

**Jira/ADO:** define states, transitions, and transition rules per project or per work item type.
**Mirai today:** `WorkItemStatus` is a hard-coded five-value union (`New`, `Active`, `Resolved`, `Closed`, `Removed`) compiled into the frontend.
Every team on earth gets Microsoft's 2005 process template, and a team wanting "In Review" cannot have it.
**Proposal:** make statuses data, defined per project (with the current five as the default template), and drive the status pickers and board column mapping (BD-3) from that data.
This is the deepest change in this document and should be sequenced deliberately.
**Priority:** P1 · **API:** yes

### PC-2 - Custom fields

**Jira/ADO:** arbitrary user-defined fields (dropdown, number, date, user picker) per project, appearing on the form, in queries, and in reports.
**Mirai today:** the field set is fixed in `src/types/work-items.ts`.
**Proposal:** a custom field definition per project and a `customFields` bag on the work item, rendered generically in the detail dialog.
**Priority:** P2 · **API:** yes

### PC-3 - Custom work item types

**Mirai today:** `WorkItemType` is a hard-coded union of `UserStory`, `Bug`, `Defect`, `Epic`, `Feature`.
Note that `Bug` and `Defect` coexist with no documented distinction, which is itself worth resolving.
**Proposal:** project-configurable types with their own icon, colour, and hierarchy level.
**Priority:** P2 · **API:** yes

### PC-4 - Automation rules

**Jira:** "when a PR merges, transition to Done"; "when an item sits in Review for 3 days, notify the lead".
**ADO:** state transition rules.
**Mirai today:** nothing.
The GitHub integration already receives PR events, so the trigger source exists but is not acted upon.
**Proposal:** a rule builder (trigger, condition, action), starting with the two or three rules teams actually use.
**Priority:** P2 · **API:** yes

### PC-5 - Area paths / components

**Jira:** components.
**ADO:** area paths, which route work to a team automatically.
**Mirai today:** work is assigned to a team at creation (`CreateWorkItemRequest.assignedTeamId`) and there is no sub-project categorisation.
Tags are being used as a substitute, which does not scale.
**Priority:** P2 · **API:** yes

---

## 9. Notifications, collaboration, and personal workspace

### NC-1 - A personal "My work" view

**Jira/ADO:** the landing page is *your* work - assigned to you, mentioning you, recently viewed.
**Mirai today:** `HomeRedirectPage` bounces you to an organization; there is no personal view anywhere in the route tree.
A user has no way to answer "what am I supposed to be doing?" without visiting each project.
**Proposal:** a cross-project "My work" page: assigned to me, mentioning me, recently viewed.
This is high value and comparatively cheap.
**Priority:** P0 · **API:** yes

### NC-2 - Email notifications and digests

**Jira/ADO:** email is the default channel, with per-event and digest control.
**Mirai today:** notifications are in-app only (`notification-bell.tsx` plus SignalR); `NotificationPreferences` toggles four categories with no channel choice.
Anyone not currently looking at the tab misses everything.
**Proposal:** an email channel with per-category and digest preferences, extending the existing preferences model.
**Priority:** P1 · **API:** yes

### NC-3 - Comment threads and reactions

**Jira/ADO:** threaded replies and emoji reactions.
**Mirai today:** `Comment` is flat, with no parent and no reactions.
**Proposal:** a `parentCommentId` and a reactions sub-resource.
**Priority:** P2 · **API:** yes

### NC-4 - Mention a team, and link a work item inline

**Mirai today:** `@` mentions resolve to individual users only (`getMentionableProjectUsers`), and there is no `#123` work item autolink in rich text.
**Proposal:** extend the existing Tiptap mention extension with a team mention and a work item reference node.
The extension architecture in `src/components/common/mention/` was built for exactly this kind of extension.
**Priority:** P2 · **API:** partial

### NC-5 - Activity feed

**Jira/ADO:** a project-level stream of recent changes.
**Mirai today:** `WorkItemChangeSet` history exists per item, but there is no aggregated project feed.
**Priority:** P2 · **API:** yes

---

## 10. Integrations and DevOps

The GitHub integration (repo connection, automatic and manual PR links) is genuinely good and ahead of a stock Jira install.
The gaps are the rest of the development lifecycle.

### IN-1 - Branch and commit linking

**Jira/ADO:** the development panel shows branches, commits, PRs, builds, and deployments for an issue, and offers "Create branch" from the issue.
**Mirai today:** only pull requests are linked (`WorkItemPullRequestLink`); branches and commits are not.
**Proposal:** extend the GitHub integration to link branches and commits, and add a "Create branch" action that names the branch from the work item key (depends on WI-7).
**Priority:** P1 · **API:** yes

### IN-2 - Smart commits

**Jira:** `PROJ-123 #done` in a commit message transitions the issue.
**Mirai today:** not possible - there is no quotable key (WI-7) and no automation (PC-4).
**Priority:** P2 · **API:** yes

### IN-3 - Build and deployment status

**ADO Pipelines / Jira + CI:** show whether the code for this item passed CI and where it is deployed.
**Mirai today:** absent.
**Priority:** P2 · **API:** yes

### IN-4 - Slack / Teams integration

**Jira/ADO:** notifications into a channel, and issue unfurling.
**Mirai today:** absent.
**Priority:** P2 · **API:** yes

### IN-5 - Public REST API, webhooks, and OAuth apps

**Jira/ADO:** a documented API, webhooks, and an app ecosystem.
**Mirai today:** the API exists but is consumed only by first-party clients; there are no outbound webhooks.
Webhooks are the cheapest path to every integration above.
**Priority:** P2 · **API:** yes

---

## 11. Import, export, and migration

### IM-1 - Work item CSV import

**Jira/ADO:** bulk CSV import is how every real migration starts.
**Mirai today:** there is a tag import job pipeline (`tag-import-jobs`) but nothing equivalent for work items.
The background-job infrastructure it uses is directly reusable.
**Proposal:** a work item CSV import modelled on the existing tag import flow, including the progress UI.
**Priority:** P1 · **API:** yes

### IM-2 - Jira / Azure DevOps importer

**Proposal:** a guided importer that maps Jira issue types and statuses onto Mirai's, since no team switches tools without bringing history.
Depends on IM-1 and, to be lossless, on PC-1 and PC-2.
**Priority:** P2 · **API:** yes

### IM-3 - Project export / backup

**Mirai today:** no way to get your data out, which is a real objection during procurement.
**Priority:** P2 · **API:** yes

---

## 12. Administration, security, and lifecycle

### AD-1 - Custom roles and a permission editor

**Mirai today:** the `Permission` enum and `RoleScope` are well-designed, and `roles.ts` lists roles - but roles appear to be fixed server-side, with no UI to create a role or edit its permission set.
**Proposal:** a role editor in organization settings, backed by the permission model that already exists.
Most of the hard thinking is already done.
**Priority:** P1 · **API:** yes

### AD-2 - Recycle bin and soft delete

**Jira/ADO:** deleted items are recoverable; ADO has an explicit recycle bin.
**Mirai today:** `deleteWorkItem` is a hard delete, and `WorkItemStatus.Removed` exists but is unrelated to deletion.
**Proposal:** soft delete with a project recycle bin and restore.
**Priority:** P1 · **API:** yes

### AD-3 - Project archiving and project templates

**Jira/ADO:** archive a finished project; create a new project from a process template (Scrum, Agile, Basic).
**Mirai today:** a project can only be created blank or deleted permanently.
**Priority:** P2 · **API:** yes

### AD-4 - Audit log

**Jira/ADO:** an org-level audit trail of permission and configuration changes.
**Mirai today:** work item history exists; administrative actions are not audited.
**Priority:** P2 · **API:** yes

### AD-5 - SSO, SAML, SCIM, and 2FA

**Mirai today:** email/password plus GitHub OAuth.
Enterprise buyers will not proceed without SAML/SCIM.
The Keycloak-brokered architecture noted in `CLAUDE.md` is the right place to solve this.
**Priority:** P2 · **API:** yes

---

## 13. UX and platform polish

### UX-1 - Optimistic updates on the board

Dragging a card currently waits on the round trip.
Jira and ADO both move the card instantly and reconcile afterwards.
TanStack Query's `onMutate` makes this straightforward, and it is the single most felt performance difference.
**Priority:** P1 · **API:** no

### UX-2 - Virtualised lists for large boards and backlogs

`Column.hasMoreCards`/`totalCardCount` show that pagination was anticipated, but a 500-item backlog tree renders every node.
**Priority:** P2 · **API:** no

### UX-3 - Mobile and responsive layouts

Jira and ADO both ship mobile apps; Mirai's board and tables assume a wide viewport.
At minimum, the work item detail dialog and the notification bell should be usable on a phone.
**Priority:** P2 · **API:** no

### UX-4 - Accessibility audit

Radix primitives give a strong baseline for free, but drag-and-drop (boards, backlog ranking) needs an explicit keyboard alternative, which dnd-kit supports and which is currently unconfigured.
**Priority:** P1 · **API:** no

### UX-5 - Internationalisation

All copy is hard-coded English.
Worth deciding *now* whether i18n is in scope, because retrofitting it across every component later is dramatically more expensive.
**Priority:** P2 · **API:** no

---

## Suggested sequencing

The P0 items are not a wish list; they are the set that a team piloting Mirai would hit within their first sprint.

**Milestone 1 - Make one sprint work end to end.**
SP-2 (edit/delete a sprint), SP-1 (sprint lifecycle and carry-over), BL-1 (backlog ranking), BL-2 (drag into a sprint), RP-1 (sprint-scoped burndown).
Without these, Mirai can describe a sprint but cannot run one.

**Milestone 2 - Make the board honest and usable.**
BD-3 (column-to-status mapping, which is arguably a bug), BD-1 (board filters), QF-1 (work item filtering), UX-1 (optimistic drag).

**Milestone 3 - Make the tool personal.**
NC-1 (My work), WI-1 (dates), WI-7 (work item keys), NC-2 (email notifications).

**Milestone 4 - Differentiate.**
PL-1 (roadmap) is the item most likely to win a head-to-head evaluation, and the data model is already most of the way there.

PC-1 (custom workflows) is the highest-risk item in this document.
It is P1 by importance and last by sequence, because it touches the board, the query layer, and every status picker at once - and because BD-3 should land first so that column-to-status mapping already exists to generalise.

## Deliberately out of scope

Recorded so the omissions are visible as decisions rather than oversights.

- **Test plans and test case management** (ADO Test Plans, Jira/Xray) - a product in its own right.
- **Service desk / ITSM / SLAs** (Jira Service Management) - a different buyer and a different product.
- **CI/CD execution** (ADO Pipelines) - integrate with GitHub Actions rather than compete with it.
- **A marketplace and third-party app ecosystem** - premature; a public API and webhooks (IN-5) capture most of the value.
