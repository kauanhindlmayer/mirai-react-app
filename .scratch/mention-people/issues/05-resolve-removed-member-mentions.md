# 05 — Resolve mentions of removed project members

**What to build:** A mention referencing someone who has since been removed
from the project still resolves to their last-known display name instead of
showing a broken or empty reference (the chip is name-only, so there's no
avatar to resolve). Today, mention chips resolve names via the current
project members list (`useProjectUsersQuery`), which excludes anyone no
longer on the project — this ticket adds the fallback path for that case.

**Depends on (external, not a blocker in this repo):** this requires a new
mirai-api endpoint that resolves a user by ID (or bulk-resolves a list of
IDs) without scoping to current project membership — no such endpoint
exists today (only `/users/me` and project-scoped member lists). This
ticket cannot be completed until that endpoint exists; coordinate with the
mirai-api side before starting.

**Blocked by:** 01 — Shared @mention Tiptap extension + suggestion popover.

**Status:** ready-for-agent

- [ ] A mention chip for a user ID not present in the current project members list falls back to a dedicated lookup instead of failing to resolve
- [ ] The fallback lookup result is used consistently everywhere mentions render (wiki body, comments, description, acceptance criteria)
- [ ] If the fallback lookup itself has no record of the user (never existed / hard-deleted), the chip shows a clear, generic placeholder rather than breaking the surrounding content
- [ ] Behavior is covered by a test that simulates a mentioned user absent from the project members cache
