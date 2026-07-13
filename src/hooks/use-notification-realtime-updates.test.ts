import type { HubConnection } from "@microsoft/signalr"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { waitFor } from "@testing-library/react"

vi.mock("@/lib/signalr", () => ({ createHubConnection: vi.fn() }))

import { createHubConnection } from "@/lib/signalr"
import { useNotificationRealtimeUpdates } from "@/hooks/use-notification-realtime-updates"
import { notificationsQueryKey } from "@/queries/notifications"
import {
  createTestQueryClient,
  renderHookWithProviders,
} from "@/test/test-utils"
import type { PaginatedList } from "@/types/common"
import type { Notification } from "@/types/notifications"

function buildConnection() {
  const handlers: Record<string, (payload: Notification) => void> = {}

  const connection = {
    on: vi.fn((event: string, handler: (payload: Notification) => void) => {
      handlers[event] = handler
    }),
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
  }

  return {
    connection: connection as unknown as HubConnection,
    trigger: (event: string, payload: Notification) => handlers[event]?.(payload),
    mocks: connection,
  }
}

function buildNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: "notification-1",
    type: "AddedToProject",
    entityId: "project-1",
    message: "You were added to the project \"Mirai\".",
    readAtUtc: null,
    createdAtUtc: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

function buildPage(items: Notification[]): PaginatedList<Notification> {
  return {
    items,
    totalCount: items.length,
    pageSize: 20,
    page: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    totalPages: 1,
  }
}

beforeEach(() => {
  vi.mocked(createHubConnection).mockReset()
})

describe("useNotificationRealtimeUpdates", () => {
  it("connects to the notifications hub and starts the connection", () => {
    const { connection, mocks } = buildConnection()
    vi.mocked(createHubConnection).mockReturnValue(connection)

    renderHookWithProviders(() => useNotificationRealtimeUpdates())

    expect(createHubConnection).toHaveBeenCalledWith("/hubs/notifications")
    expect(mocks.start).toHaveBeenCalled()
  })

  it("prepends a pushed notification into every cached notifications query", async () => {
    const { connection, trigger } = buildConnection()
    vi.mocked(createHubConnection).mockReturnValue(connection)
    const queryClient = createTestQueryClient()

    const unreadKey = [
      ...notificationsQueryKey(),
      { page: 1, pageSize: 1, unreadOnly: true },
    ]
    const listKey = [
      ...notificationsQueryKey(),
      { page: 1, pageSize: 20, unreadOnly: false },
    ]
    queryClient.setQueryData(unreadKey, buildPage([]))
    queryClient.setQueryData(listKey, buildPage([]))

    renderHookWithProviders(() => useNotificationRealtimeUpdates(), {
      queryClient,
    })

    const pushed = buildNotification({ message: "New notification!" })
    trigger("notification-received", pushed)

    await waitFor(() => {
      const unreadPage = queryClient.getQueryData<PaginatedList<Notification>>(unreadKey)
      expect(unreadPage?.items).toContainEqual(pushed)
      expect(unreadPage?.totalCount).toBe(1)
    })

    const listPage = queryClient.getQueryData<PaginatedList<Notification>>(listKey)
    expect(listPage?.items).toContainEqual(pushed)
    expect(listPage?.totalCount).toBe(1)
  })

  it("does not duplicate a notification already present in the cache", async () => {
    const { connection, trigger } = buildConnection()
    vi.mocked(createHubConnection).mockReturnValue(connection)
    const queryClient = createTestQueryClient()

    const existing = buildNotification()
    const listKey = [
      ...notificationsQueryKey(),
      { page: 1, pageSize: 20, unreadOnly: false },
    ]
    queryClient.setQueryData(listKey, buildPage([existing]))

    renderHookWithProviders(() => useNotificationRealtimeUpdates(), {
      queryClient,
    })

    trigger("notification-received", existing)

    await waitFor(() => {
      const listPage = queryClient.getQueryData<PaginatedList<Notification>>(listKey)
      expect(listPage?.items).toHaveLength(1)
      expect(listPage?.totalCount).toBe(1)
    })
  })

  it("stops the connection on unmount", () => {
    const { connection, mocks } = buildConnection()
    vi.mocked(createHubConnection).mockReturnValue(connection)

    const { unmount } = renderHookWithProviders(() =>
      useNotificationRealtimeUpdates()
    )
    unmount()

    expect(mocks.stop).toHaveBeenCalled()
  })
})
