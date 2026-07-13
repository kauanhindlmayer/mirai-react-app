export type NotificationType =
  | "AddedToProject"
  | "AddedToTeam"
  | "AddedToOrganization"

export type Notification = {
  id: string
  type: NotificationType
  entityId: string
  message: string
  readAtUtc: string | null
  createdAtUtc: string
}
