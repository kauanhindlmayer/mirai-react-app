import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationsFilter,
} from "@/api/notifications"
import { createErrorToastHandler } from "@/lib/query-helpers"

export function notificationsQueryKey() {
  return ["notifications"]
}

export function useNotificationsQuery(
  filters: NotificationsFilter,
  options?: { enabled?: boolean; refetchInterval?: number }
) {
  return useQuery({
    queryKey: [...notificationsQueryKey(), filters],
    queryFn: () => listNotifications(filters),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
  })
}

export function useMarkNotificationAsReadMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markNotificationAsRead,
    onError: createErrorToastHandler("Failed to mark notification as read."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey() })
    },
  })
}

export function useMarkAllNotificationsAsReadMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onError: createErrorToastHandler("Failed to mark all notifications as read."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey() })
    },
  })
}
