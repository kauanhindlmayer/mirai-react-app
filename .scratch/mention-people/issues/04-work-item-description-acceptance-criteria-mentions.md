# 04 — Work item description & acceptance criteria mentions

**What to build:** Editing a work item's description or its acceptance
criteria lets you `@mention` a project member inline, using the shared
mention capability from ticket 01. Both fields get identical treatment —
bundled into one ticket since they're the same new minimal, no-toolbar
mention-capable editor used twice in the same dialog, replacing the current
plain `<Textarea>`/`useDraftField` handling for each. Visual style stays
close to today's plain look — no new formatting toolbar.

**Depends on (external, not a blocker in this repo):** mirai-api must have
backfilled existing plain-text `description`/`acceptanceCriteria` content
into equivalent HTML before this ships to production, for the same reason
as ticket 03. Confirm this backfill has happened (or is scheduled to land
together) before merging.

**Blocked by:** 01 — Shared @mention Tiptap extension + suggestion popover.

**Status:** ready-for-agent

- [ ] The work item description field supports `@mention` using the shared extension from ticket 01
- [ ] The work item acceptance criteria field supports `@mention` using the same editor
- [ ] Neither field gains a formatting toolbar — mention support only
- [ ] Saving either field persists mentions correctly and they render on reload
- [ ] Existing descriptions/acceptance criteria with no mentions render exactly as they did before this change, assuming the backend content backfill described above
- [ ] The commit-on-blur-only-if-changed behavior these fields currently have is preserved
