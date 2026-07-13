export type NotificationType =
  | "AddedToProject"
  | "AddedToTeam"
  | "AddedToOrganization"
  | "AssignedWorkItemChanged"
  | "MentionedInWorkItemComment"
  | "MentionedInWikiPageComment"
  | "WorkItemCommentAdded"

export type Notification = {
  id: string
  type: NotificationType
  entityId: string
  message: string
  readAtUtc: string | null
  createdAtUtc: string
}

export type NotificationPreferences = {
  mentionsEnabled: boolean
  assignedWorkItemChangesEnabled: boolean
  workItemCommentsEnabled: boolean
  membershipEnabled: boolean
}
