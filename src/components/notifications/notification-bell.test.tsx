import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>()
  return { ...actual, useNavigate: vi.fn() }
})

import { useNavigate } from "react-router"

import { NotificationBell } from "@/components/notifications/notification-bell"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"
import type { Notification } from "@/types/notifications"
import type { PaginatedList } from "@/types/common"

const navigate = vi.fn()

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

function buildPaginatedList(items: Notification[]): PaginatedList<Notification> {
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

function mockNotifications(unread: Notification[], all: Notification[]) {
  server.use(
    http.get("*/api/notifications", ({ request }) => {
      const url = new URL(request.url)
      const unreadOnly = url.searchParams.get("unreadOnly") === "true"
      return HttpResponse.json(
        buildPaginatedList(unreadOnly ? unread : all)
      )
    })
  )
}

beforeEach(() => {
  navigate.mockClear()
  vi.mocked(useNavigate).mockReturnValue(navigate)
})

describe("NotificationBell", () => {
  it("shows the unread count badge", async () => {
    mockNotifications(
      [buildNotification({ id: "a" }), buildNotification({ id: "b" })],
      []
    )
    renderWithProviders(<NotificationBell />)

    expect(await screen.findByText("2")).toBeInTheDocument()
  })

  it("does not show a badge when there are no unread notifications", async () => {
    mockNotifications([], [])
    renderWithProviders(<NotificationBell />)

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Notifications" })
      ).toBeInTheDocument()
    )
    expect(screen.queryByText("0")).not.toBeInTheDocument()
  })

  it("shows a placeholder when there are no notifications", async () => {
    mockNotifications([], [])
    const user = userEvent.setup()
    renderWithProviders(<NotificationBell />)

    await user.click(screen.getByRole("button", { name: "Notifications" }))

    expect(await screen.findByText("No notifications yet.")).toBeInTheDocument()
  })

  it("renders notifications when opened", async () => {
    const notification = buildNotification({ message: "Someone mentioned you." })
    mockNotifications([notification], [notification])
    const user = userEvent.setup()
    renderWithProviders(<NotificationBell />)

    await user.click(screen.getByRole("button", { name: "Notifications" }))

    expect(await screen.findByText("Someone mentioned you.")).toBeInTheDocument()
  })

  it("marks a notification as read and navigates to its target when clicked", async () => {
    const notification = buildNotification({
      id: "notification-1",
      type: "AddedToProject",
      entityId: "project-42",
    })
    mockNotifications([notification], [notification])

    let markReadCalled = false
    server.use(
      http.post("*/api/notifications/notification-1/mark-read", () => {
        markReadCalled = true
        return new HttpResponse(null, { status: 200 })
      })
    )

    const user = userEvent.setup()
    renderWithProviders(<NotificationBell />)

    await user.click(screen.getByRole("button", { name: "Notifications" }))
    await user.click(await screen.findByText(notification.message))

    await waitFor(() => expect(markReadCalled).toBe(true))
    expect(navigate).toHaveBeenCalledWith("/projects/project-42/summary")
  })

  it("marks all notifications as read when the button is clicked", async () => {
    mockNotifications(
      [buildNotification({ id: "a" })],
      [buildNotification({ id: "a" })]
    )

    let markAllReadCalled = false
    server.use(
      http.post("*/api/notifications/mark-all-read", () => {
        markAllReadCalled = true
        return new HttpResponse(null, { status: 200 })
      })
    )

    const user = userEvent.setup()
    renderWithProviders(<NotificationBell />)

    await user.click(screen.getByRole("button", { name: "Notifications" }))
    await user.click(
      await screen.findByRole("button", { name: "Mark all as read" })
    )

    await waitFor(() => expect(markAllReadCalled).toBe(true))
  })
})
