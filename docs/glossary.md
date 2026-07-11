# Glossary

## Mention

An inline, identity-bound reference to a specific person embedded in rich
text (work item description, work item acceptance criteria, wiki page body,
or a comment), created by typing `@` and picking someone from a
project-member picker.

A mention is a **one-time reference**, not an ongoing subscription — it does
not change the mentioned person's watcher/subscriber state on the item.
Rendered as a chip that resolves the person's current display name/avatar by
user ID (not a name frozen at the time the mention was created).

Not to be confused with **Tag** (below) — the shared word "tag" in this
codebase always means the colored topical label, never a person reference.
See [ADR 0001](adr/0001-mention-people-in-work-items-wiki-and-comments.md).

## Tag

A colored, named topical label attachable to a work item (`src/types/tags.ts`
— `name`, `description`, `color`, `workItemsCount`). Unrelated to people;
see **Mention** for referencing a person.

## Mentionable user

A person eligible to appear in the `@`-mention picker for a given work item,
wiki page, or comment: scoped to that item's **project members**
(`getProjectUsers`), not the whole organization and not just the item's
team. Matches the access scope the item already has.
