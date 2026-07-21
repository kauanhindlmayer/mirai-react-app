# 05 - State-gated sprint operations

**What to build:** Editing, deleting, and adding work to a sprint were built
before sprints had a lifecycle, so they still behave identically whatever state a
sprint is in - you can delete a sprint the team is currently running, or edit a
finished sprint's dates and silently rewrite history. The decision record for that
earlier work explicitly deferred this, on the grounds that there was no lifecycle
to guard against yet. There is now.

Make every sprint operation respect the sprint's state:

A **completed sprint is read-only** - it cannot be edited, deleted, or have work
added to it. This is what makes "a past sprint's committed-versus-completed
figures never change" true rather than merely intended.

A sprint that has **started cannot be deleted** - it has real history (a
commitment, delivered work) that should not be casually destroyed. Deleting stays
available while a sprint is still `Planned`.

An **active sprint can be extended but not re-planned**: its name and end date stay
editable, because teams genuinely do need a few more days, but its start date is
locked once started - the record of when it actually began must stay honest, and
the commitment snapshot is anchored to that moment. The existing rule that sprints
in a team may not overlap continues to apply to any new end date.

Work can still be **added to an active sprint** - that is legitimate mid-sprint
scope change, and it is already recorded as such by sitting outside the commitment.

The overflow menu should offer only what the sprint's state actually allows, so
the UI never dangles an action the API will refuse.

**Blocked by:** 04 - Complete a sprint with carry-over.

**Status:** ready-for-agent

- [ ] A `Completed` sprint cannot be edited, deleted, or have work items added to
      it; each attempt is rejected with a clear reason.
- [ ] A `Planned` sprint can still be fully edited (name, start date, end date) and
      deleted, as today.
- [ ] An `Active` sprint's name and end date can be changed; changing its start
      date is rejected.
- [ ] An `Active` sprint cannot be deleted.
- [ ] Changing an active sprint's end date still cannot overlap another sprint in
      the team.
- [ ] Work items can still be added to an `Active` sprint, and doing so does not
      alter its committed scope.
- [ ] The overflow menu shows Start/Edit/Delete for a `Planned` sprint,
      Complete/Edit for an `Active` sprint, and nothing actionable for a
      `Completed` sprint.
- [ ] The edit dialog for an active sprint does not offer the start date for
      change.
- [ ] The decision record supersedes the earlier note that delete and edit carry no
      lifecycle guard.
