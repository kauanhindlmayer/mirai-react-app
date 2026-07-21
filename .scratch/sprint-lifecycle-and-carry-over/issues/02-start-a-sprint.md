# 02 - Start a sprint

**What to build:** Today a sprint is just a named date range - nothing
distinguishes the sprint a team is actually working in from ones already finished
or not yet begun. Give a scrum master the ability to *start* a sprint as a
deliberate act.

Starting a Planned sprint makes it the team's Active sprint. Only one sprint per
team may be Active at a time - a second attempt is refused, and the refusal holds
even if two people click Start simultaneously. The active sprint is visually
distinguished in the sprint picker and is the sprint selected by default when the
sprints page opens, so a scrum master lands on the sprint they are most likely
working with.

Start is offered only on a Planned sprint (never on one already active or
completed), and only to someone who can manage the team's sprints - the same
permission that already gates creating, editing, and deleting a sprint. A sprint
with no work items in it can still be started; teams that plan inside the sprint
should not be blocked.

Sprint state is an explicit, stored fact - `Planned`, `Active`, `Completed` - not
something inferred from today's date, because starting and completing are
deliberate acts rather than calendar events. Every sprint that exists today
becomes `Planned`.

**Blocked by:** None - can start immediately.

**Status:** ready-for-agent

- [ ] A sprint has a status of `Planned`, `Active`, or `Completed`; every existing
      sprint is `Planned`.
- [ ] A scrum master can start a `Planned` sprint, which becomes `Active` and
      records when it was started.
- [ ] Starting a sprint while another sprint on the same team is `Active` is
      rejected with a message naming the conflict.
- [ ] Two simultaneous start requests cannot leave a team with two active sprints
      - the database itself refuses the second, and a test proves it (a unit test
      cannot see this).
- [ ] Starting a sprint that is already `Active` or `Completed` is rejected.
- [ ] A sprint with no work items can be started.
- [ ] Someone without permission to manage the team's sprints is not offered Start,
      and the API rejects the attempt regardless.
- [ ] A sprint's status is visible in the API response.
- [ ] The sprint picker visually distinguishes the active sprint from planned and
      completed ones.
- [ ] Opening the sprints page selects the active sprint by default, falling back
      to the most recent sprint when no sprint is active.
- [ ] Start appears in the sprint's overflow menu only for a `Planned` sprint.
- [ ] An architecture decision record captures the lifecycle model and why state is
      stored rather than derived from dates; the glossary defines **Sprint status**.
