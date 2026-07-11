# 1. Mention people in work items, wiki pages, and comments

## Status

Accepted

## Context

We want to let users reference a specific person inline in text, the way
Jira's `@mention` (an ADF node carrying the user's `accountId`, rendered as a
one-time notification) and Azure DevOps's `@mention` control (a user-ID token
embedded as `data-vss-mention="version:2.0,{userID}"` in HTML or `@<userID>`
in Markdown) both work.

This codebase already has a `Tag` entity (`src/types/tags.ts`) — a colored
topical label on work items, unrelated to people. It also has three different
text-editing surfaces in three different states:

- Wiki page body (`wiki-page-editor.tsx`): a real Tiptap rich-text editor,
  content stored as HTML, no `Mention` extension installed.
- Work item `description` / `acceptanceCriteria`: plain `<Textarea>`, plain
  string content, edited via `useDraftField`.
- Comments (`comment-section.tsx`, shared by work items and wiki pages):
  plain `<Textarea>`, plain string content, rendered with
  `whitespace-pre-wrap`.

A `getProjectUsers` API already exists and returns the same access-scoped
member list that governs who can see the work item/wiki page in the first
place. There is no notification center, bell icon, or email delivery
anywhere in this frontend today (mirai-api, a separate repo, may or may not
have one). There is also no "get user by ID" endpoint — only `/users/me` and
project-scoped member lists.

## Decision

- **Terminology**: call this concept a **Mention**, not a "tag" — `Tag`
  already means a colored topical label in this codebase, and reusing the
  word for people would collide in code, UI copy, and conversation. See the
  glossary.
- **Mechanism**: a mention is an inline `@`-triggered token embedded in rich
  text, identity-bound to a user ID (Jira/ADO model), not a separate
  structured "tagged people" field. A durable side-record of each mention
  (who mentioned whom, where, when) is kept alongside the rich-text content
  so mention history survives edits to the surrounding text.
- **Surfaces**: all of work item `description`, work item
  `acceptanceCriteria`, wiki page body, and comments (work item + wiki, via
  the shared `CommentSection`) get mention support in this pass, so the two
  long-text work item fields stay consistent with each other.
  - Work item `description`/`acceptanceCriteria` and comments move from
    plain-string content to Tiptap-authored HTML to make this possible.
    They get a **minimal, mention-only editor** — no bold/italic/list
    toolbar — so their visual style stays close to today's plain look;
    only the wiki editor keeps the full formatting toolbar.
  - Existing plain-text rows are **backfilled once** (escaped and wrapped
    into equivalent HTML) so the renderer only ever has to handle one
    content format going forward, rather than detecting and branching on
    legacy plain-text vs. new HTML indefinitely.
- **Who's mentionable**: project members only, reusing `getProjectUsers` —
  the same set of people who already have access to the item. This sidesteps
  the ADO gotcha where mentioning an org-wide user who lacks project access
  invites them or produces a dead reference.
- **Identity resolution**: a mention chip stores the user ID and resolves
  the displayed name live (not a name snapshotted at mention time), so
  renames are reflected everywhere automatically.
  - Because there's no existing "get user by ID" endpoint, and
    `getProjectUsers` excludes people no longer on the project, resolving a
    mention of someone since removed from the project requires a **new
    backend lookup** (an org/user-by-ID or bulk-resolve endpoint). This is a
    mirai-api dependency this feature introduces, not something the
    frontend can work around.
- **Notification scope (v1)**: persist the mention and render it — no
  delivery mechanism yet. There's no notification center to deliver into
  today; building one is a separate, larger project. Mentioning does **not**
  change the mentioned person's watcher/subscriber state on the item — it's
  a one-time reference, matching Jira's explicit separation of "mention"
  from "watch," not ADO's auto-subscribe-adjacent behavior.

## Consequences

- `Comment.content`, `WorkItem.description`, and `WorkItem.acceptanceCriteria`
  change meaning from "plain string" to "HTML string, possibly containing
  mention chips" — a breaking change to how mirai-api stores and returns
  these fields, requiring the one-time backfill migration described above.
- A new domain is needed following this repo's `api/` → `queries/` →
  component convention (e.g. `mentions.ts` across `src/api/`,
  `src/queries/`, `src/types/`) for the durable mention side-record, plus a
  reusable mention-picker/editor component consumed by the description,
  acceptance criteria, and comment editors.
- mirai-api needs a new user-by-ID (or bulk) lookup endpoint that isn't
  scoped to current project membership, purely so historical mentions of
  since-removed members can still resolve to a name.
- Building an actual notification center (bell icon, read/unread feed,
  delivery) is explicitly deferred; this ADR only guarantees the data model
  will have what that future project needs (who was mentioned, where, when).
- Azure DevOps's wiki-comment behavior — notifying *all* wiki followers
  regardless of who's mentioned — is not adopted here since there's no
  delivery mechanism yet; revisit when the notification center is designed.
