# 05 — Resolve mentions of removed project members

**What to build:** A mention referencing someone who has since been removed
from the project still resolves to their last-known display name instead of
showing a broken or empty reference (the chip is name-only, so there's no
avatar to resolve). Today, mention chips resolve names via the current
project members list (`useProjectUsersQuery`), which excludes anyone no
longer on the project — this ticket adds the fallback path for that case.

**Depended on (external, now resolved):** required a new mirai-api endpoint
that resolves users by ID within a project's organization, without scoping
to current project membership. Implemented as `GET
/organizations/{organizationId}/projects/{projectId}/users/resolve?userIds=...`
in the mirai-api repo (`Application.Projects.Queries.ResolveProjectUsers`),
authorized the same way as `GetProjectUsers` (`Permission.ProjectView` on
the project), scoped to the project's **organization** membership so it
also covers someone removed from the project but still in the org. A user
id matching no one in that organization (never existed / hard-deleted, or
removed from the org entirely) is simply omitted from the response — the
frontend's generic placeholder covers that case.

**Blocked by:** 01 — Shared @mention Tiptap extension + suggestion popover.

**Status:** ready-for-agent

- [x] A mention chip for a user ID not present in the current project members list falls back to a dedicated lookup instead of failing to resolve
- [x] The fallback lookup result is used consistently everywhere mentions render (wiki body, comments, description, acceptance criteria) — implemented once in `useMentionableProjectUsers`, shared by all four surfaces
- [x] If the fallback lookup itself has no record of the user (never existed / hard-deleted), the chip shows a clear, generic placeholder ("Unknown user") rather than breaking the surrounding content
- [x] Behavior is covered by a test that simulates a mentioned user absent from the project members cache
