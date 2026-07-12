# Mention people in work items, wiki pages, and comments

See [ADR 0001](../adr/0001-mention-people-in-work-items-wiki-and-comments.md)
and the [glossary](../glossary.md) (**Mention**, **Tag**, **Mentionable
user**) for the terminology and decisions this spec builds on.

## Problem Statement

When someone is working in a work item's description, its acceptance
criteria, a wiki page, or a comment on either, and they need to draw a
specific project member's attention to something, there's no way to do that
directly in the text. They have to fall back to a side channel (Slack,
email) and separately paste a link, which loses the context of exactly which
sentence or line prompted it, and gives the reader no durable trail of who
was pointed at what.

## Solution

Let any project member be referenced inline, by name, at the exact point in
the text that concerns them — typing `@` opens a picker scoped to the
project's members (showing each person's avatar in the picker), picking a
name inserts a **Mention**: a name-only chip that always resolves to that
person's current display name. This works identically in work item
descriptions, acceptance criteria, wiki page bodies, and comments (on either
work items or wiki pages).

A mention is a one-time reference, not a subscription — it doesn't change
who's watching the item going forward. It doesn't yet notify anyone (there's
no notification center in this app to notify through); it establishes the
data and rendering so that a future notification feature has what it needs
from day one.

## User Stories

1. As a project member writing a work item's description, I want to type `@` and see a picker of this project's members, so that I can reference someone without leaving the text field.
2. As a project member, I want the `@` picker to filter as I keep typing a name, so that I can find the right person quickly in a project with many members.
3. As a project member, I want to navigate the `@` picker with arrow keys and confirm with Enter/Tab, so that I don't have to reach for the mouse mid-sentence.
4. As a project member, I want to dismiss the `@` picker with Escape without inserting anything, so that I can back out of a mention I didn't mean to start.
5. As a project member, I want the same `@`-mention behavior in a work item's description as in its acceptance criteria, so that the two fields don't behave inconsistently.
6. As a project member, I want to mention someone inside a work item comment, so that I can call out a specific person's attention on a specific discussion point.
7. As a project member, I want to mention someone inside a wiki page's body text, so that documentation can point at the person responsible for a section.
8. As a project member, I want to mention someone inside a wiki page comment, so that wiki discussions work the same way as work item discussions.
9. As a project member, I want the `@` picker to only ever offer people who are members of this project, so that I can't accidentally reference someone who has no access to what I'm writing.
10. As a project member, I want a rendered mention to show the person's current display name, so that if they change their name later, old mentions of them still make sense.
11. As a project member, I want a mention of someone who has since been removed from the project to still show a meaningful name (not a broken reference), so that historical context isn't lost when project membership changes.
12. As a project member, I want to be able to mention myself, so that the editor doesn't need special-case behavior to block it, even though it's a no-op in terms of any future notification.
13. As a project member, I want deleting the mention chip's text (e.g. selecting and backspacing over it) to remove it as a single unit, so that I can't leave a partially-edited, broken mention behind.
14. As a project member editing a comment or description after the fact, I want to add or remove mentions freely, so that the text stays accurate as a conversation evolves.
15. As a project member, I want to include more than one mention in the same block of text, so that I can address several people in one comment or paragraph.
16. As a project member, I want work item descriptions, acceptance criteria, and comments to keep their current plain, chat-like appearance (no new bold/italic/list toolbar), so that adding mentions doesn't change the editing experience for text that isn't a wiki page.
17. As a project member, I want the wiki page editor to keep its existing formatting toolbar alongside the new mention capability, so that wiki authoring doesn't lose functionality it already has.
18. As a project member reading an old comment or description written before this feature existed, I want it to render exactly as it used to, so that the migration to the new content format doesn't visibly change anything for content that has no mentions.
19. As a developer building future features on top of this, I want a durable, queryable record of who was mentioned, where, and when, so that a future "mentioned in" view or notification center doesn't need to re-parse rich-text content to find that information.
20. As a project member, I want mentioning someone to have no effect on their watcher/subscriber status for that item, so that "mention" and "watch" stay two separate, deliberately-chosen things.
21. As a project member, I want mentioning someone to not trigger an email or any other delivery right now, so that I'm not surprised by a notification channel this app doesn't actually have yet.

## Implementation Decisions

- **Terminology**: this feature is called a **Mention** throughout code, UI copy, and this spec — never "tag" — to avoid colliding with the existing `Tag` (colored label) entity in `src/types/tags.ts`.
- **Shared mention seam (the one seam this feature is tested at)**: a single Tiptap `Mention` extension configuration plus its suggestion popover component owns all `@`-trigger, filter, keyboard-navigation, and chip-insertion behavior. All four call sites (work item description, acceptance criteria, comments, wiki body) configure the same extension instance/factory rather than each implementing their own trigger/picker logic. This requires adding `@tiptap/extension-mention` (and its `@tiptap/suggestion` peer) as a dependency — not currently installed.
  - The suggestion list's data source is the existing `useProjectUsersQuery` hook (`src/queries/projects.ts`) — no new query is needed to populate the picker.
- **Two editor configurations, one shared core**:
  - Wiki page body keeps its existing `WikiPageEditor` (Tiptap `StarterKit` + toolbar), extended with the shared Mention extension.
  - Work item description, acceptance criteria, and comments move from plain `<Textarea>`/plain-string content to a new minimal editor: Tiptap with the Mention extension but no formatting toolbar, visually close to today's plain text fields.
  - Both editor configurations are built on the one shared mention seam described above, so mention behavior itself isn't duplicated between them.
- **Content format migration**: `Comment.content`, `WorkItem.description`, and `WorkItem.acceptanceCriteria` change from plain string to HTML string (Tiptap's `getHTML()` output, matching how wiki page content already works). Existing rows are backfilled once — escaped and wrapped into equivalent HTML — so the frontend renderer only ever handles one content format, never branching between legacy plain-text and new HTML.
- **Mentionable scope**: the picker is scoped to the current project's members via `getProjectUsers`/`useProjectUsersQuery` — the same access boundary that already governs who can see the work item or wiki page.
- **Identity resolution**: a mention chip stores the mentioned person's user ID and resolves the displayed name live, not a name snapshotted at creation time — renames are reflected automatically wherever the mention is rendered. The chip itself is name-only (`@Full Name`); an avatar is shown only in the `@`-mention picker, not in the rendered chip.
- **Removed-member fallback**: resolving a mention of someone no longer on the project requires a backend lookup not scoped to current project membership (`getProjectUsers` excludes them). Implemented in mirai-api as `resolveProjectUsers` (`GET .../users/resolve?userIds=...`), scoped to the project's organization membership instead. `useMentionableProjectUsers` tries the current project members list first and only falls back to this lookup once that's confirmed not to have a match, to avoid firing it for the common case (mentioning a current member). A user id that resolves nowhere (never existed, hard-deleted, or removed from the organization entirely) renders as a generic "Unknown user" placeholder rather than breaking the surrounding content.
- **Durable mention record**: a new domain (`mentions`, following this repo's `api/` → `queries/` → `types` one-file-per-domain convention) persists each mention (mentioned user ID, source item/comment, timestamp) independently of rich-text parsing, so future features can query "where was I mentioned" without re-parsing content.
- **Notification/subscription behavior**: creating a mention has no side effect on watcher/subscriber state, and triggers no delivery (email, in-app, or otherwise) in this pass — there is no notification center in this app yet. This spec only guarantees the data (who/where/when) exists for that future work.

## Testing Decisions

- Tests assert observable behavior — what a user sees and can do (the `@` picker appearing with each person's avatar, filtering as you type, a chip being inserted and rendering a name, a chip disappearing when deleted) — not Tiptap's or ProseMirror's internal document structure.
- The shared Tiptap Mention extension + suggestion popover is the single seam under test: mount a host editor configured with it, type `@` plus a partial name, assert the filtered list of project members appears, assert arrow-key navigation and Enter/Tab selection insert the right chip, assert Escape dismisses without inserting, assert a rendered chip shows the current display name for a given user ID. Covering this once means the four call sites don't need their own copies of this test.
- Each of the four call sites (description field, acceptance criteria field, `CommentSection`, wiki body) gets a thin wiring test only — confirming the shared mention-capable editor is actually mounted and its `onChange`/save path receives HTML content — not a re-test of picker/keyboard/chip behavior.
- Prior art: `src/components/wiki-pages/wiki-page-comments.test.tsx` and `src/components/work-items/work-item-comments.test.tsx` already exercise `CommentSection` through MSW-mocked mutations and are the template for the wiring tests at those two call sites; `src/hooks/use-draft-field.ts`'s tests are the template for a hook-level test if the minimal editor's commit-on-blur logic is factored into a hook.
- Content-migration backfill itself is a backend/mirai-api concern and isn't covered by this repo's test suite; this repo's tests only need to confirm the renderer correctly displays HTML content (with and without mention chips), per the "no legacy plain-text branch" decision above.

## Out of Scope

- Building an actual notification center (bell icon, read/unread feed, email delivery) — deferred to a future project; this spec only produces the data it will need.
- Auto-subscribing a mentioned person as a watcher/subscriber.
- Mentioning anyone outside the current project's membership (org-wide or cross-project mentions).
- Full rich-text formatting (bold/italic/lists) for description, acceptance criteria, or comments — they gain only mention support, not a general editor upgrade.
- Any change to the existing `Tag` (colored label) feature.
- Backfilling/migrating existing plain-text `Comment.content`/`WorkItem.description`/`WorkItem.acceptanceCriteria` rows themselves (a mirai-api data migration, not frontend work).
- The new mirai-api user-by-ID/bulk-resolve endpoint's implementation (a backend dependency this spec surfaces but does not design).

## Further Notes

- Azure DevOps's behavior where a wiki comment notifies *all* wiki followers regardless of who's mentioned was deliberately not adopted, since there's no delivery mechanism at all yet in this app — revisit once the notification center is designed.
- Self-mentions are allowed and require no special-case handling, matching both Jira's and Azure DevOps's behavior (a self-mention simply never has anyone to notify).
