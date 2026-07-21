# Glossary

## Sprint

A named, time-boxed iteration owned by a single team, spanning an **inclusive**
range of calendar dates - a sprint dated the 1st to the 14th includes the 14th,
so one ending the 14th and one starting the 15th are back-to-back, not
overlapping.

Within its team, a sprint's name is unique and its dates may not overlap another
sprint's. The API is the authority on both and rejects a violation by naming the
sprint that was clashed with, which the UI surfaces as a toast. The start- and
end-date pickers additionally *disable* the days other sprints already occupy
(and the end picker stops short of the next sprint's start), so an overlapping
range cannot normally be built at all - the toast is the backstop for a race, not
the primary feedback.

Sprint dates cross the wire as plain `yyyy-MM-dd` strings (`Sprint.startDate`) -
that is what the API's `DateOnly` emits and accepts. `Date` objects exist only
inside the picker; `sprint-dates.ts` owns the conversion at that boundary, and
parses with `date-fns`'s `parseISO` (local midnight) rather than `new Date(...)`
(UTC midnight, which renders as the *previous day* west of Greenwich).

Deleting a sprint returns its work items to the **Backlog** (below) and is
permanent. See
[mirai-api ADR 0009](https://github.com/kauanhindlmayer/mirai-api/blob/main/docs/adr/0009-sprint-editing-deletion-and-non-overlap.md).

## Sprint status

Where a sprint is in its lifecycle: **Planned** (created, not yet begun),
**Active** (someone started it), or **Completed**. It is stored, not inferred
from today's date - a sprint is active because a scrum master started it, not
because the calendar reached its start date.

A team has at most one Active sprint. The API refuses to start a second and
names the one already running; a filtered unique index makes that hold even for
two simultaneous requests.

The picker badges the Active and Completed sprints (Planned needs no badge, being
the default), and the sprints page selects the active sprint by default, falling
back to the most recent when none is active.

## Backlog

The work items belonging to no sprint. Backlog membership is not a flag or a
separate list - a work item is in the backlog precisely when it belongs to no
sprint, which is why deleting a sprint puts its work items back there.

## Mention

An inline, identity-bound reference to a specific person embedded in rich
text (work item description, work item acceptance criteria, wiki page body,
or a comment), created by typing `@` and picking someone from a
project-member picker.

A mention is a **one-time reference**, not an ongoing subscription — it does
not change the mentioned person's watcher/subscriber state on the item.
Rendered as a chip that resolves the person's current display name by user
ID (not a name frozen at the time the mention was created). The chip is
name-only — the picker is the only place a mentionable person's avatar
appears.

Not to be confused with **Tag** (below) — the shared word "tag" in this
codebase always means the colored topical label, never a person reference.
See [ADR 0001](adr/0001-mention-people-in-work-items-wiki-and-comments.md).

## Tag

A colored, named topical label attachable to a work item (`src/types/tags.ts`
— `name`, `description`, `color`, `workItemsCount`). Unrelated to people;
see **Mention** for referencing a person.

## Mentionable user

A person eligible to appear in the `@`-mention picker for a given work item,
wiki page, or comment: scoped to that item's **project members**
(`getProjectUsers`), not the whole organization and not just the item's
team. Matches the access scope the item already has.
