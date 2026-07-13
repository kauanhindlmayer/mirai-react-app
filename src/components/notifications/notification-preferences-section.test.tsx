import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

import { NotificationPreferencesSection } from "@/components/notifications/notification-preferences-section"
import { setAccessToken } from "@/lib/auth-storage"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"
import type { NotificationPreferences } from "@/types/notifications"
import { toast } from "sonner"

function buildToken(payload: Record<string, unknown>): string {
  return `header.${btoa(JSON.stringify(payload))}.signature`
}

function signIn() {
  setAccessToken(buildToken({ exp: Math.floor(Date.now() / 1000) + 3600 }))
}

function mockPreferences(preferences: NotificationPreferences) {
  signIn()
  server.use(
    http.get("*/api/notifications/preferences", () =>
      HttpResponse.json(preferences)
    )
  )
}

const allEnabled: NotificationPreferences = {
  mentionsEnabled: true,
  assignedWorkItemChangesEnabled: true,
  workItemCommentsEnabled: true,
  membershipEnabled: true,
}

beforeEach(() => {
  localStorage.clear()
  vi.mocked(toast.error).mockClear()
  vi.mocked(toast.success).mockClear()
})

describe("NotificationPreferencesSection", () => {
  it("shows the switches reflecting the current preferences", async () => {
    mockPreferences({ ...allEnabled, mentionsEnabled: false })
    renderWithProviders(<NotificationPreferencesSection />)

    expect(await screen.findByLabelText("Mentions")).not.toBeChecked()
    expect(screen.getByLabelText("Assigned work items")).toBeChecked()
  })

  it("persists a toggled preference immediately without a save button", async () => {
    mockPreferences(allEnabled)
    let requestBody: unknown
    server.use(
      http.put("*/api/notifications/preferences", async ({ request }) => {
        requestBody = await request.json()
        return new HttpResponse(null, { status: 200 })
      })
    )

    const user = userEvent.setup()
    renderWithProviders(<NotificationPreferencesSection />)

    await user.click(await screen.findByLabelText("Mentions"))

    expect(
      screen.queryByRole("button", { name: /save/i })
    ).not.toBeInTheDocument()
    await waitFor(() =>
      expect(requestBody).toEqual({ ...allEnabled, mentionsEnabled: false })
    )
  })

  it("rolls back the toggle and shows an error toast when saving fails", async () => {
    mockPreferences(allEnabled)
    server.use(
      http.put("*/api/notifications/preferences", () => HttpResponse.error())
    )

    const user = userEvent.setup()
    renderWithProviders(<NotificationPreferencesSection />)

    const mentionsSwitch = await screen.findByLabelText("Mentions")
    await user.click(mentionsSwitch)

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to update notification preferences.",
        expect.anything()
      )
    )
    await waitFor(() => expect(mentionsSwitch).toBeChecked())
  })

  it("shows an error state with a retry action when preferences fail to load", async () => {
    signIn()
    server.use(
      http.get("*/api/notifications/preferences", () => HttpResponse.error())
    )

    renderWithProviders(<NotificationPreferencesSection />)

    expect(
      await screen.findByText("Couldn't load notification preferences")
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /try again/i })
    ).toBeInTheDocument()
  })
})
