# 01 - Velocity counts only Closed work

**What to build:** The velocity chart currently rewards work that is only
`Resolved` (dev-done, awaiting verification) as if it were delivered, while the
rest of the sprint lifecycle work (tickets 03-05) treats anything not `Closed` as
unfinished and offers it for carry-over. Left as-is, the same work item would
count toward a sprint's velocity *and* be rolled into the next sprint as
unfinished - two parts of the product disagreeing about what "done" means.

Make `Closed` the single, project-wide definition of delivered: a product owner
looking at the velocity chart sees only genuinely finished work, and that number
agrees with what the sprint report and the carry-over dialog will later say.

This is a deliberate, user-visible behaviour change - teams currently see
`Resolved` points in their velocity and will stop seeing them until those items
are `Closed`. It is safe to make now because only test data exists. It is
independent of the sprint lifecycle and can land first, so nothing built later has
to reconcile two definitions.

**Blocked by:** None - can start immediately.

**Status:** ready-for-agent

- [ ] A sprint's velocity counts the story points of its `Closed` work items only.
- [ ] `Resolved` work items do not contribute to velocity points or to the
      completed work item count.
- [ ] `Removed` work items continue to contribute nothing.
- [ ] Work items with no story points continue to contribute nothing to the
      points total, but still count toward the completed work item count.
- [ ] A test covers the change, asserting that a `Resolved` item is excluded and a
      `Closed` item is included.
- [ ] The behaviour change is noted where the project records such decisions, so a
      future reader does not "fix" it back.
