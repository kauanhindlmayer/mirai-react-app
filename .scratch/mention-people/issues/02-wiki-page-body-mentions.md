# 02 — Wiki page body mentions

**What to build:** Writing or editing a wiki page's body lets you
`@mention` a project member inline, using the shared mention capability
from ticket 01. This is the lowest-risk surface: the wiki editor is already
Tiptap-based and its content is already stored as HTML, so this is wiring
the shared extension into the existing editor, not a content-format
migration. The existing formatting toolbar (bold/italic/lists, etc.) is
unaffected and stays exactly as it is today.

**Blocked by:** 01 — Shared @mention Tiptap extension + suggestion popover.

**Status:** ready-for-agent

- [x] The wiki page body editor supports `@mention` using the shared extension from ticket 01
- [x] The existing formatting toolbar continues to work unchanged
- [x] A saved wiki page renders its mentions correctly on reload (chip with current display name/avatar)
- [x] Existing wiki pages with no mentions render exactly as they did before this change
