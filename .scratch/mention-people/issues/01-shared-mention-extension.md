# 01 — Shared @mention Tiptap extension + suggestion popover

**What to build:** A single, reusable `@mention` capability — the one seam
every mention-enabled surface in this app will plug into. Typing `@` opens a
popover listing the current project's members (via the existing
`useProjectUsersQuery`), filtered as you keep typing. Arrow keys move the
selection, Enter/Tab inserts a mention chip for the highlighted person,
Escape dismisses the popover without inserting anything. A rendered chip
always resolves to the mentioned person's *current* display name and
avatar by user ID (never a name frozen at creation time). Deleting a chip's
text removes it as a single unit rather than leaving a broken partial
mention behind.

This ticket has no production consumer yet — see ADR 0001 and the spec for
why: it's deliberately built and proven in isolation first, then wired into
each real surface by tickets 02–04.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [x] `@tiptap/extension-mention` (and its `@tiptap/suggestion` peer) added as a dependency
- [x] Typing `@` plus a partial name in a host editor shows a popover filtered to matching project members
- [x] Arrow-key navigation and Enter/Tab selection insert the correct mention chip
- [x] Escape dismisses the popover without inserting a mention
- [x] A rendered mention chip shows the mentioned user's current display name and avatar, resolved by user ID
- [x] Selecting/deleting a mention chip's text removes the whole chip, never a partial fragment
- [x] Behavior is covered by tests mounted against a bare host editor (no production surface required) per the test-standards conventions
