import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  getNotificationPreferences,
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  updateNotificationPreferences,
  type NotificationsFilter,
} from "@/api/notifications"
import { createErrorToastHandler } from "@/lib/query-helpers"
import type { NotificationPreferences } from "@/types/notifications"

export function notificationsQueryKey() {
  return ["notifications"]
}

export function notificationPreferencesQueryKey() {
  return ["notification-preferences"]
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

export function useNotificationPreferencesQuery() {
  return useQuery({
    queryKey: notificationPreferencesQueryKey(),
    queryFn: getNotificationPreferences,
  })
}

export function useUpdateNotificationPreferencesMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (preferences: NotificationPreferences) =>
      updateNotificationPreferences(preferences),
    onError: createErrorToastHandler("Failed to update notification preferences."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationPreferencesQueryKey() })
    },
  })
}
