# 03 — Comment mentions (work items + wiki pages)

**What to build:** Writing a comment — on a work item or on a wiki page —
lets you `@mention` a project member inline, using the shared mention
capability from ticket 01. Because both surfaces already go through the
same shared `CommentSection` component, this is one ticket: it migrates
that component off its current plain `<Textarea>`/plain-string content onto
the new minimal, no-toolbar mention-capable editor. The comment's visual
style stays close to today's plain, chat-like look — no new bold/italic/list
toolbar is introduced.

**Depends on (external, not a blocker in this repo):** mirai-api must have
backfilled existing plain-text comment content into equivalent HTML before
this ships to production — otherwise old comments written before this
change will render incorrectly once the frontend starts treating
`Comment.content` as HTML. Confirm this backfill has happened (or is
scheduled to land together) before merging.

**Blocked by:** 01 — Shared @mention Tiptap extension + suggestion popover.

**Status:** ready-for-agent

- [ ] The comment editor (used by both work items and wiki pages) supports `@mention` using the shared extension from ticket 01
- [ ] The comment editor has no formatting toolbar — mention support only, visual style otherwise unchanged
- [ ] A saved comment renders its mentions correctly on reload, on both a work item and a wiki page
- [ ] Existing comments with no mentions render exactly as they did before this change, assuming the backend content backfill described above
- [ ] Adding, editing, and removing mentions in an existing comment works correctly
