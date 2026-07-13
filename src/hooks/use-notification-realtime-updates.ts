import { useEffect, useRef } from "react"
import type { HubConnection } from "@microsoft/signalr"
import { useQueryClient } from "@tanstack/react-query"

import { createHubConnection } from "@/lib/signalr"
import { notificationsQueryKey } from "@/queries/notifications"
import type { PaginatedList } from "@/types/common"
import type { Notification } from "@/types/notifications"

const NOTIFICATIONS_HUB = "/hubs/notifications"
const NOTIFICATION_RECEIVED_EVENT = "notification-received"

/**
 * Connects to the notifications hub for the lifetime of the component and
 * merges each pushed notification directly into every matching cached
 * notifications query (the unread-count query and, if the panel has been
 * opened, the recent-list query) - rather than invalidating and refetching -
 * so the bell badge and panel update instantly with no round trip. A pushed
 * notification is always unread, so prepending it and bumping totalCount is
 * correct for both an unreadOnly:true and an unreadOnly:false cached query.
 */
export function useNotificationRealtimeUpdates() {
  const queryClient = useQueryClient()
  const connectionRef = useRef<HubConnection | null>(null)

  useEffect(() => {
    const connection = createHubConnection(NOTIFICATIONS_HUB)
    connectionRef.current = connection

    connection.on(NOTIFICATION_RECEIVED_EVENT, (notification: Notification) => {
      queryClient.setQueriesData<PaginatedList<Notification>>(
        { queryKey: notificationsQueryKey() },
        (page) => {
          if (!page) return page
          if (page.items.some((item) => item.id === notification.id)) return page
          return {
            ...page,
            items: [notification, ...page.items],
            totalCount: page.totalCount + 1,
          }
        }
      )
    })

    connection.start().catch((error: unknown) => {
      console.error("Error connecting to notifications hub:", error)
    })

    return () => {
      void connection.stop()
      connectionRef.current = null
    }
  }, [queryClient])
}
