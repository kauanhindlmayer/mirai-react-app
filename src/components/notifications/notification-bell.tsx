import { useState } from "react"
import { useNavigate } from "react-router"
import { BellIcon } from "lucide-react"

import {
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
  useNotificationsQuery,
} from "@/queries/notifications"
import type { Notification } from "@/types/notifications"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const RECENT_NOTIFICATIONS_PAGE_SIZE = 20
const UNREAD_COUNT_REFETCH_INTERVAL_MS = 60_000
const MAX_DISPLAYED_UNREAD_COUNT = 99

function getNotificationUrl(notification: Notification): string | null {
  switch (notification.type) {
    case "AddedToProject":
      return `/projects/${notification.entityId}/summary`
    case "AddedToOrganization":
      return `/organizations/${notification.entityId}/projects`
    case "AddedToTeam":
      // No standalone team page exists in the app yet - the notification
      // is still readable and markable, it just doesn't navigate anywhere.
      return null
    default:
      return null
  }
}

export function NotificationBell() {
  const navigate = useNavigate()

  const [isOpen, setIsOpen] = useState(false)

  const { data: unreadData } = useNotificationsQuery(
    { page: 1, pageSize: 1, unreadOnly: true },
    { refetchInterval: UNREAD_COUNT_REFETCH_INTERVAL_MS }
  )
  const { data } = useNotificationsQuery(
    { page: 1, pageSize: RECENT_NOTIFICATIONS_PAGE_SIZE, unreadOnly: false },
    { enabled: isOpen }
  )
  const markAsRead = useMarkNotificationAsReadMutation()
  const markAllAsRead = useMarkAllNotificationsAsReadMutation()

  const unreadCount = unreadData?.totalCount ?? 0
  const notifications = data?.items ?? []

  function handleNotificationClick(notification: Notification) {
    if (!notification.readAtUtc) {
      markAsRead.mutate(notification.id)
    }
    setIsOpen(false)

    const url = getNotificationUrl(notification)
    if (url) navigate(url)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Notifications"
          className="relative"
        >
          <BellIcon />
          {unreadCount > 0 ? (
            <Badge
              variant="destructive"
              className="absolute -top-1.5 -right-1.5 h-4 min-w-4 justify-center px-1"
            >
              {unreadCount > MAX_DISPLAYED_UNREAD_COUNT
                ? `${MAX_DISPLAYED_UNREAD_COUNT}+`
                : unreadCount}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-medium">Notifications</span>
          <Button
            variant="ghost"
            size="sm"
            disabled={unreadCount === 0 || markAllAsRead.isPending}
            onClick={() => markAllAsRead.mutate()}
          >
            Mark all as read
          </Button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              No notifications yet.
            </p>
          ) : (
            notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  "flex w-full flex-col gap-0.5 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted",
                  !notification.readAtUtc && "bg-accent/50"
                )}
              >
                <span>{notification.message}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(notification.createdAtUtc).toLocaleString()}
                </span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
