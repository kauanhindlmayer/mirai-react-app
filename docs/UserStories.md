# User Stories

The backlog in [Backlog.md](Backlog.md) is written from the product's point of view: what is missing relative to Jira and Azure DevOps.
This file restates the same items from the *user's* point of view, so they can be picked up and estimated directly.

Story IDs match the backlog IDs exactly (`SP-1` here is `SP-1` there), so the two files can be read side by side.
P0 and P1 stories carry acceptance criteria.
P2 stories are stated as one-liners, on the grounds that writing detailed criteria for work that will not be scheduled this year is waste.

## Personas

These map onto the personas the product already models (`src/types/personas.ts`), and are used consistently below.

- **Developer** - picks up work, moves cards, links pull requests.
- **Product owner** - owns the backlog, its order, and what a sprint commits to.
- **Scrum master / team lead** - runs the ceremonies, watches the charts, unblocks people.
- **Stakeholder** - does not log in daily and wants to know whether things are on track.
- **Administrator** - configures the organization, its projects, and who can do what.

---

## Milestone 1 - Make one sprint work end to end

### SP-2 - Edit and delete a sprint

**As a** scrum master,
**I want** to edit a sprint's name and dates, or delete it entirely,
**so that** a sprint created with the wrong dates is not permanent.

**Acceptance criteria**

- Given a sprint I have permission to manage, when I open the sprint's overflow menu, then I see "Edit" and "Delete".
- Given I edit the name or dates, when I save, then the sprint list reflects the change immediately.
- Given I give the sprint a name or a date range that clashes with another sprint in the team, when I save, then I am told which, and nothing changes.
- Given a sprint that contains work items, when I delete it, then I am warned how many items will be returned to the backlog, and I must confirm.
- Given I lack `TeamManageSprints`, then neither action is offered, and nor is "New Sprint".

**Notes**

The board and the burndown are not sprint-scoped today - the board shows a team's
cards regardless of sprint, and the burndown is one team-wide series. Making them
honour a sprint's dates is BD-3 and RP-1, not this story; an earlier draft of these
criteria implied it was already tested behaviour here, and it is not.

The overflow menu hangs off the sprint picker and acts on the selected sprint,
rather than one menu per row: sprints are a `<Select>`, and a Radix `SelectItem`
cannot host a menu trigger. SP-1 will likely turn the picker into a list (it needs
to show active/future/completed per sprint), and the per-row menu comes with it.

### SP-1 - Sprint lifecycle and carry-over

**As a** scrum master,
**I want** to start and complete a sprint, and decide what happens to unfinished work,
**so that** velocity and the burndown mean something.

**Acceptance criteria**

- Given a future sprint, when I start it, then it becomes the active sprint, and its committed scope is recorded at that moment.
- Only one sprint per team can be active at a time.
- Given the active sprint, when I complete it, then I am shown every incomplete item and can send each to the next sprint or back to the backlog.
- Given a completed sprint, then it is read-only, and its committed-versus-completed figures no longer change.
- The active sprint is visually distinguished from future and completed ones in every sprint picker.

### BL-1 - Rank the backlog

**As a** product owner,
**I want** to drag items up and down the backlog,
**so that** the team can see what is most important without asking me.

**Acceptance criteria**

- Given the backlog, when I drag an item to a new position, then the new order persists and is visible to everyone else after a refetch.
- Rank is the default sort order of the backlog.
- Given I reorder a parent, then its children move with it and keep their relative order.
- Reordering is possible with the keyboard alone, not only with a pointer (see UX-4).
- Given the reorder request fails, then the item returns to its original position and I see an error toast.

### BL-2 - Plan a sprint by dragging from the backlog

**As a** product owner,
**I want** to drag items from the backlog into a sprint and see the running total,
**so that** I can commit to a realistic amount of work.

**Acceptance criteria**

- Given the sprint planning view, then I see the backlog on one side and the selected sprint's contents on the other.
- Given I drag an item into the sprint, then it is added, and the sprint's total story points update immediately.
- Given I drag an item out of the sprint, then it returns to the backlog.
- Given the sprint's total exceeds the team's capacity, then the total is shown in a warning state (see SP-4).

### RP-1 - Sprint burndown and sprint report

**As a** scrum master,
**I want** a burndown for the sprint I am actually running, and a report of what we committed versus what we delivered,
**so that** the retrospective has facts in it.

**Acceptance criteria**

- Given the active sprint, then the burndown is scoped to that sprint's dates and its committed scope, not to an arbitrary date range.
- Given a completed sprint, then I can see committed points, completed points, and items carried over.
- Given work is added to a sprint after it starts, then the burndown shows the scope increase rather than silently absorbing it.

---

## Milestone 2 - Make the board honest and usable

### BD-3 - Moving a card changes the work item's status

**As a** developer,
**I want** dragging a card to "Done" to actually mark the work item as done,
**so that** the board and the work item never disagree.

**Acceptance criteria**

- Given a board column, then it is mapped to exactly one work item status, configurable in the board settings.
- Given I move a card between columns, then the underlying work item transitions to the target column's status.
- Given a work item's status is changed from the detail dialog, then its card moves to the corresponding column.
- Given the existing boards, then a migration maps their current columns onto the current statuses, with no board left unmapped.

*This one closes an existing correctness gap: today `moveCard` does not touch the work item's status at all.*

### BD-1 - Filter the board

**As a** developer,
**I want** to filter the board down to my own cards, or to one tag or type,
**so that** a board with eighty cards on it is still readable.

**Acceptance criteria**

- Given the board, then I see an avatar row of the assignees on it, and clicking one shows only their cards.
- Given I filter, then column headers show the filtered count against the total.
- Given I have filtered the board, then the filter is reflected in the URL, so I can share the filtered view.
- Filters clear in one action.

### QF-1 - Filter the work item list

**As a** product owner,
**I want** to filter work items by type, status, assignee, and tag,
**so that** I can answer "what bugs are still open" without reading every row.

**Acceptance criteria**

- Given the work items page, then I can filter by type, status, assignee, and tag, and combine those filters.
- Given a filter is applied, then pagination and sorting operate over the filtered set, and the total count reflects it.
- Given filters are applied, then they are held in the URL and survive a reload.
- Given a filter combination matches nothing, then I see an empty state that offers to clear the filters.

### UX-1 - The board responds instantly

**As a** developer,
**I want** a card I drag to move immediately,
**so that** the board does not feel slower than the tool I came from.

**Acceptance criteria**

- Given I drop a card, then it renders in its new position before the server responds.
- Given the move fails, then the card returns to its original position and I see an error toast.
- Given a concurrent move by someone else, then the SignalR-driven refetch reconciles to the server's truth without the card flickering.

---

## Milestone 3 - Make the tool personal

### NC-1 - My work

**As a** developer,
**I want** one page that shows everything assigned to me across all my projects,
**so that** I can start my day without visiting each project in turn.

**Acceptance criteria**

- Given I sign in, then I land on a personal view rather than an organization picker.
- The view shows work assigned to me, work that mentions me, and items I recently opened, each grouped and each spanning every project I belong to.
- Given I click an item, then it opens in the work item detail dialog, in the context of its own project.
- Given I have no assigned work, then I see an empty state rather than a blank page.

### WI-1 - Dates on work items

**As a** stakeholder,
**I want** work items to carry start and due dates,
**so that** I can tell what is late.

**Acceptance criteria**

- Given a work item, then I can set a start date and a due date, and clear either.
- Given a due date in the past on an item that is not closed, then the item is flagged as overdue on its card and in the list.
- Given a parent whose children have dates, then the parent shows the implied range.
- Dates are stored in UTC and rendered in the viewer's locale, consistently with the existing timestamp handling.

### WI-7 - Human-readable work item keys

**As a** developer,
**I want** to refer to a work item as `MIRAI-142` rather than `#142`,
**so that** I can quote it in a commit message, a branch name, or Slack without ambiguity.

**Acceptance criteria**

- Given a project, then it has a short key (2 to 10 uppercase characters), set at creation and editable in project settings.
- The key must be unique within the organization.
- Given any place a work item code is shown today, then it now shows `KEY-code`.
- Given I paste a work item key into the global search, then that item is the first result.

### NC-2 - Email notifications

**As a** developer,
**I want** to be emailed when I am mentioned or when work assigned to me changes,
**so that** I do not miss things while I am not looking at the tab.

**Acceptance criteria**

- Given the notification preferences, then each existing category can be enabled per channel, in-app and email, independently.
- Given an event I have subscribed to by email, then I receive an email that links directly to the item.
- Given I have chosen a daily digest, then I receive one email rather than one per event.
- Given I generate an event myself, then I am not notified about my own action.

### WI-4 - Reporter and watchers

**As a** developer,
**I want** to follow a work item I care about without being assigned to it,
**so that** I hear about changes to work that affects mine.

**Acceptance criteria**

- Given a work item, then it records who reported it, defaulting to its creator.
- Given a work item, then I can watch and unwatch it, and see who else is watching.
- Given I watch an item, then I receive its notifications according to my preferences.
- Given I comment on an item, then I begin watching it, unless I have opted out of that behaviour.

---

## Milestone 4 - Differentiate

### PL-1 - Roadmap

**As a** stakeholder,
**I want** a timeline of epics and features across teams,
**so that** I can see what is landing when, without reading a backlog.

**Acceptance criteria**

- Given the roadmap, then each epic and feature with dates is drawn as a bar on a timeline, grouped by team.
- Given an item has a `Predecessor` link, then the dependency is drawn between the two bars.
- Given I drag a bar's edge, then the item's start or target date changes, subject to my permissions.
- Given an epic whose children are complete, then its bar shows progress derived from its children's story points.
- The roadmap is readable at quarter and at month zoom.

### PL-3 - Blocked work is visible

**As a** scrum master,
**I want** blocked items to announce themselves,
**so that** I find out on the board rather than at standup.

**Acceptance criteria**

- Given the work item link types, then `Blocks` and `BlockedBy` exist alongside the current four.
- Given an item is blocked by an item that is not closed, then its card shows a blocked indicator, and hovering it names the blocker.
- Given the blocker closes, then the indicator clears without further action.

---

## Querying and bulk work

### QF-3 - Bulk edit

**As a** product owner,
**I want** to select many work items and change them at once,
**so that** triaging thirty items does not mean thirty dialogs.

**Acceptance criteria**

- Given the work items table, then I can select rows individually, or select every row matching the current filter.
- Given a selection, then I can set status, assignee, sprint, or tags on all of them in one action.
- Given a bulk action partially fails, then I am told exactly which items failed and why, and the successful ones stay applied.
- The number of selected items is always visible while a selection exists.

### QF-2 - Saved queries

**As a** product owner,
**I want** to save a filter and share it with my team,
**so that** "the triage queue" is a link rather than a set of instructions.

**Acceptance criteria**

- Given a filtered work item view, then I can save it under a name.
- Given a saved query, then I can choose whether it is private or shared with the project.
- Saved queries are listed in the sidebar and open the list view with their filters applied.

### QF-4 - Search across projects

**As a** developer,
**I want** search to find things outside the project I happen to be looking at,
**so that** I can find an item without first remembering where it lives.

**Acceptance criteria**

- Given the ⌘K palette, then results span every project I have access to, and are labelled with their project.
- Results include work items and wiki pages, not work items alone.
- Given more results than fit in the palette, then I can open a full results page and filter it.
- Given no project context, then search still works, which it does not today.

---

## Sprints and capacity

### SP-3 - Sprint goal

**As a** scrum master,
**I want** to state a one-line goal for the sprint,
**so that** the team can tell whether a new request belongs in it.

**Acceptance criteria**

- Given a sprint, then it has an optional goal, editable while it is active.
- The goal is shown at the top of the board and in the sprint report.

### SP-4 - Capacity

**As a** scrum master,
**I want** to record how much each person is available for,
**so that** we do not commit to a sprint that was never going to fit.

**Acceptance criteria**

- Given a sprint, then I can set each member's capacity, and record team days off.
- Given the sprint planning view, then I see allocation against capacity per person and for the team.
- Given a person is over-allocated, then their bar is shown in a warning state.

---

## Reporting

### RP-2 - Cumulative flow diagram

**As a** scrum master,
**I want** a cumulative flow diagram,
**so that** I can see where work is piling up.

**Acceptance criteria**

- Given a project and a date range, then the CFD shows the count of items in each status over time, derived from the change history already recorded in `WorkItemChangeSet`.
- Hovering a point shows the counts per status on that date.
- The chart is consistent with the existing chart components in look, tooltip, and empty state.

---

## Administration

### AD-1 - Custom roles

**As an** administrator,
**I want** to define a role and choose its permissions,
**so that** I can grant someone exactly what they need.

**Acceptance criteria**

- Given organization settings, then I can create a role, name it, scope it, and select from the existing `Permission` set.
- Given a role is in use, then deleting it requires reassigning its members first.
- Given the built-in roles, then they cannot be deleted, and editing them is either prevented or clearly marked as a customisation.
- Changes take effect without the affected user signing out again.

### AD-2 - Recycle bin

**As an** administrator,
**I want** deleted work items to be recoverable,
**so that** a misclick is not permanent data loss.

**Acceptance criteria**

- Given I delete a work item, then it is soft-deleted and disappears from every view.
- Given the project recycle bin, then I can see deleted items and restore them with their comments, links, and history intact.
- Restoring an item whose parent was also deleted returns it to the backlog root rather than failing.
- Items are purged after a defined retention period, and I am told what that period is.

---

## Import

### IM-1 - Import work items from CSV

**As an** administrator,
**I want** to import work items from a CSV,
**so that** moving to Mirai does not mean retyping the backlog.

**Acceptance criteria**

- Given a CSV, then I can map its columns onto work item fields before committing to the import.
- Given the import runs, then I see progress, mirroring the existing tag import job flow.
- Given some rows are invalid, then valid rows still import, and I can download a report of the failures.
- Given the import completes, then parent/child relationships expressed in the file are preserved.

---

## Development integration

### IN-1 - Branches and commits on the work item

**As a** developer,
**I want** to create a branch from a work item, and see its commits alongside its pull requests,
**so that** the work item tells the whole story of the change.

**Acceptance criteria**

- Given a work item on a project with a connected GitHub repository, then I can create a branch named from its key (depends on WI-7).
- Given commits referencing the work item, then they are listed on the item.
- The existing pull request panel and the new branch and commit panels read as one development section, not three.

---

## Accessibility

### UX-4 - The board is usable from the keyboard

**As a** developer who does not use a mouse,
**I want** to move cards and reorder the backlog with the keyboard,
**so that** I can use the product at all.

**Acceptance criteria**

- Given a card has focus, then I can pick it up, move it between columns and positions, and drop it, using the keyboard alone.
- Every drag interaction announces its state to a screen reader.
- Focus is not lost when a card moves.
- This applies to backlog ranking (BL-1) as well as to boards.

---

## P2 long tail

Stated as one-liners.
Acceptance criteria to be written when one of these is actually scheduled.

- **WI-2** As a developer, I want to log time against a work item, so that we can report on effort as well as points.
- **WI-3** As a product owner, I want priority to be a named, colour-coded scale and bugs to carry a severity, so that "priority 2" means something.
- **WI-5** As a product owner, I want work item templates, so that recurring kinds of work start out consistent.
- **WI-6** As a developer, I want to clone a work item or move it to another project, so that a mis-filed item does not have to be retyped.
- **BD-2** As a scrum master, I want swimlanes by epic or assignee, so that one board can serve several workstreams.
- **BD-4** As a scrum master, I want to choose which fields appear on a board card, so that the board shows what my team cares about.
- **BL-3** As a product owner, I want to edit estimates and assignees inline in the backlog, so that grooming does not mean opening thirty dialogs.
- **SP-5** As a product owner, I want iterations to nest, so that a feature can be planned to a release while its stories sit in sprints.
- **PL-2** As a product owner, I want releases and fix versions, so that I can say what shipped and what slipped.
- **QF-5** As a stakeholder, I want to export a query to CSV, so that I can report to people who will never log in.
- **RP-3** As a scrum master, I want to arrange my own dashboard widgets, so that the charts I look at are the ones I need.
- **RP-4** As a product owner, I want an epic burndown, so that I can track progress against something larger than a sprint.
- **PC-1** As an administrator, I want to define my own statuses and transitions, so that my team's process is not Microsoft's from 2005.
- **PC-2** As an administrator, I want custom fields, so that I can track what my domain actually needs.
- **PC-3** As an administrator, I want custom work item types, so that the type list matches how we work. (This should also settle what distinguishes `Bug` from `Defect`, which is currently undocumented.)
- **PC-4** As a scrum master, I want automation rules, so that a merged pull request closes its work item without anyone remembering to.
- **PC-5** As a product owner, I want components or area paths, so that we stop using tags as a substitute for structure.
- **NC-3** As a developer, I want threaded replies and reactions on comments, so that a long discussion stays readable.
- **NC-4** As a developer, I want to mention a team and to link a work item inline with `#142`, so that rich text can point at the things it is about.
- **NC-5** As a scrum master, I want a project activity feed, so that I can catch up on what changed while I was away.
- **IN-2** As a developer, I want smart commits, so that my commit message can transition the work item.
- **IN-3** As a developer, I want build and deployment status on the work item, so that I can see whether my change is live.
- **IN-4** As a developer, I want Mirai notifications in Slack, so that I do not have to watch a second inbox.
- **IN-5** As an administrator, I want outbound webhooks and a documented API, so that I can build the integration you have not built.
- **IM-2** As an administrator, I want a guided Jira or Azure DevOps importer, so that switching tools does not mean losing history.
- **IM-3** As an administrator, I want to export a project, so that my data is not hostage to the product.
- **AD-3** As an administrator, I want to archive a project and to create projects from a template, so that projects have a lifecycle.
- **AD-4** As an administrator, I want an audit log of permission and configuration changes, so that I can answer who changed what.
- **AD-5** As an administrator, I want SAML, SCIM, and 2FA, so that Mirai can pass a security review.
- **UX-2** As a developer, I want large boards and backlogs to stay responsive, so that success does not make the product slow.
- **UX-3** As a developer, I want to triage a work item from my phone, so that being away from a desk does not block the team.
- **UX-5** As a user, I want the product in my own language, so that I can use it comfortably. (Worth deciding now, since retrofitting i18n later is dramatically more expensive.)
