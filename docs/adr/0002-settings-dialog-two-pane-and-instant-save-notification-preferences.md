# 2. Two-pane Settings dialog with instant-save notification preferences

## Status

Accepted

## Context

The Settings dialog (`settings-dialog.tsx`, opened from `nav-user.tsx`) was a
single narrow column (`sm:max-w-sm`) that vertically stacked two sections
separated by a divider: **Account** (avatar, first/last name, explicit "Save
changes" button) and **Notification preferences** (four checkboxes with a
draft + explicit "Save changes" button). Both sections carried their own draft
state and Save button.

The notification preferences are four independent boolean categories
(`mentionsEnabled`, `assignedWorkItemChangesEnabled`,
`workItemCommentsEnabled`, `membershipEnabled`), persisted via a single
`PUT /notifications/preferences` that takes the whole object. There is no
delivery-channel concept (in-app vs email) in the API - only these four
booleans. The bell/panel is in-app only.

We wanted to improve the dialog's UI/UX, with notifications as the priority,
without touching the backend contract.

## Decision

- **Two-pane layout.** Widen the dialog and split it into a left nav
  (`Account`, `Notifications`) and a right active-pane, replacing the single
  stacked column. Below the `sm` breakpoint the nav collapses from a vertical
  side rail into a horizontal tab row above the pane (one `flex-direction`
  breakpoint, same markup). Scope stays Account + Notifications; the
  appearance/theme menu stays in `appearance-menu.tsx`.

- **Notification preferences save instantly.** Replace the checkbox + draft +
  "Save changes" model with `Switch` toggles that fire
  `useUpdateNotificationPreferencesMutation` immediately on change, with an
  optimistic cache update in `onMutate` and rollback in `onError` (toast only
  on failure). There is deliberately **no Save button** in this pane.

- **Account keeps an explicit Save.** Name and avatar are text/file edits, so
  the Account pane retains its draft + "Save changes" button.

- **Loading and error states.** The notifications pane shows skeleton rows
  while the preferences query loads and an `ErrorState` with a Retry action on
  failure, replacing the previous `return null` (which rendered a blank pane
  while loading and blank forever on error).

## Consequences

- The two settings sections now commit changes differently: notifications
  instantly, account on an explicit Save. This is intentional - independent,
  reversible boolean toggles are lower-friction with instant save, while
  free-text/file edits benefit from an explicit commit. A future reader should
  not "fix" this inconsistency by forcing both into the same model.

- Instant save relies on optimistic update + rollback rather than a single
  batched request; each toggle is its own `PUT` of the full preferences object
  (the API takes the whole object anyway).

- Adding a third settings section later means adding one entry to `SECTIONS`
  in `settings-dialog.tsx`; the responsive nav already accommodates it.

- Delivery channels (in-app vs email) remain out of scope until the API grows
  beyond the four booleans.
