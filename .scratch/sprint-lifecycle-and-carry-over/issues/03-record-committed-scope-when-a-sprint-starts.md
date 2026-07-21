# 03 - Record committed scope when a sprint starts

**What to build:** A scrum master needs "what we committed to" to be a fixed fact,
not a number that drifts as the sprint runs. Right now nothing records what a
sprint contained when it began, so committed-versus-delivered is impossible to
report and velocity reflects only whatever happens to be done at the moment you
look.

When a sprint starts, capture its **committed scope**: a snapshot of every work
item then in the sprint, each recorded with the story points it carried *at that
instant* and the status it was in. The active sprint then reports its committed
points and committed item count, and those numbers do not move when someone
re-estimates an item or adds work mid-sprint.

The snapshot is per work item, not a single total. A total would be cheaper but is
a one-way door: it can never afterwards answer "which items were added after the
sprint started", which the sprint report and burndown (RP-1) will need, and which
cannot be reconstructed once the moment has passed. Snapshot rows are written once
at start and never rewritten - that is what makes them a snapshot.

A sprint of unestimated items commits zero points; that is expected, and the
committed item count remains meaningful for teams that do not estimate. Forcing
estimation is a separate concern (SP-4).

**Blocked by:** 02 - Start a sprint.

**Status:** ready-for-agent

- [ ] Starting a sprint records one commitment entry per work item then in the
      sprint, capturing that item's story points and status at that moment.
- [ ] Starting a sprint with no work items records an empty commitment and commits
      zero points and zero items.
- [ ] Commitment entries are never modified after the sprint starts - re-estimating
      a work item, closing it, or moving it out does not change what was committed.
- [ ] Work items added to the sprint after it starts do not join the commitment.
- [ ] An active or completed sprint reports its committed story points and
      committed work item count in the API response.
- [ ] A planned sprint reports no committed figures.
- [ ] Work items with no story points contribute nothing to committed points but do
      count toward the committed item count.
- [ ] The committed figures are visible on the active sprint in the UI.
- [ ] The glossary defines **Committed scope**, including why it is a per-item
      snapshot rather than a stored total.
