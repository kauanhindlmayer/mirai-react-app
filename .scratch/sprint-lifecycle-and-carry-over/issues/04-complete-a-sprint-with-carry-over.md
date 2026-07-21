# 04 - Complete a sprint with carry-over

**What to build:** A team can start a sprint but never finish one, so unfinished
work has nowhere to go and a sprint's results are never settled.

Let a scrum master complete the active sprint as one act. Completing it shows
every incomplete work item - anything not yet `Closed`, which includes `Resolved`
items still awaiting verification - and asks where each goes: forward into the
next planned sprint, or back to the backlog. Every item defaults to the next
planned sprint, because rolling everything forward is what usually happens; any
individual item can be sent to the backlog instead. When no planned sprint exists,
the backlog is the only destination - a missing next sprint must never block
closing the current one.

Completion is atomic: the destinations are applied, the delivered figures are
frozen, and the sprint becomes `Completed` in one transaction, so a completed
sprint can never be left holding an un-triaged item. Delivered (`Closed`) and
`Removed` items stay where they are - they are the sprint's permanent record.

Committed-versus-completed compares like with like: "completed" counts only items
that were in the commitment and ended `Closed`, and scores each at the points it
was *committed* at. Work added mid-sprint and finished is scope change, not
commitment delivery, and re-estimating an item mid-sprint cannot inflate the
ratio. Both figures are frozen onto the sprint at completion, so a past sprint's
numbers can be trusted forever.

Completing does not start the next sprint. Starting is its own deliberate act with
its own commitment snapshot, usually taken days later at planning.

The disposition contract, from the design session - `target` is an explicit
discriminator so that "send to backlog" can never be confused with "no decision
made":

```json
{ "dispositions": [
    { "workItemId": "...", "target": "Backlog" },
    { "workItemId": "...", "target": "Sprint", "targetSprintId": "..." }
] }
```

**Blocked by:** 01 - Velocity counts only Closed work; 03 - Record committed scope
when a sprint starts.

**Status:** ready-for-agent

- [ ] A scrum master can complete the `Active` sprint; it becomes `Completed` and
      records when it was completed.
- [ ] Completing a sprint that is not `Active` is rejected.
- [ ] Completion lists every incomplete work item - anything whose status is not
      `Closed`, including `Resolved`.
- [ ] Every incomplete item must have a destination; a request that misses one, or
      names a destination sprint that is not `Planned`, is rejected and nothing
      changes.
- [ ] Each incomplete item defaults to the next planned sprint - the team's
      earliest `Planned` sprint by start date.
- [ ] Any individual item can be sent to the backlog instead of the next sprint.
- [ ] When no planned sprint exists, completion still works and the backlog is the
      only destination offered.
- [ ] Delivered (`Closed`) and `Removed` work items stay in the completed sprint.
- [ ] Completion is atomic - a failure part-way leaves the sprint active and no
      items moved.
- [ ] The completed sprint's completed figures count only committed items that
      ended `Closed`, each scored at its committed points.
- [ ] Work added after the sprint started and then closed does not count toward the
      completed figures.
- [ ] Re-estimating a committed item mid-sprint does not change either the
      committed or the completed figure.
- [ ] Completing a sprint does not start the next one.
- [ ] The completed sprint is visually distinguished in the sprint picker.
- [ ] Complete appears in the sprint's overflow menu only for the `Active` sprint,
      and only for someone permitted to manage the team's sprints.
- [ ] The glossary defines **Carry-over**.
