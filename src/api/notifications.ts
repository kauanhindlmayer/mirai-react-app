import { get, post } from "@/lib/api-client"
import type { PaginatedList } from "@/types/common"
import type { Notification } from "@/types/notifications"

export type NotificationsFilter = {
  page: number
  pageSize: number
  unreadOnly: boolean
}

export function listNotifications(
  filters: NotificationsFilter
): Promise<PaginatedList<Notification>> {
  const params: Record<string, string> = {
    page: filters.page.toString(),
    pageSize: filters.pageSize.toString(),
    unreadOnly: filters.unreadOnly.toString(),
  }
  return get("/notifications", { params })
}

export function markNotificationAsRead(notificationId: string): Promise<void> {
  return post(`/notifications/${notificationId}/mark-read`)
}

export function markAllNotificationsAsRead(): Promise<void> {
  return post("/notifications/mark-all-read")
}
