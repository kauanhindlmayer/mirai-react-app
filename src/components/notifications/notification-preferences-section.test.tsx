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

function mockPreferences(preferences: NotificationPreferences) {
  setAccessToken(buildToken({ exp: Math.floor(Date.now() / 1000) + 3600 }))
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
  it("shows the toggles pre-filled with the current preferences", async () => {
    mockPreferences({ ...allEnabled, mentionsEnabled: false })
    renderWithProviders(<NotificationPreferencesSection />)

    expect(
      await screen.findByLabelText("Mentions in comments")
    ).not.toBeChecked()
    expect(
      screen.getByLabelText("Changes to work items assigned to me")
    ).toBeChecked()
  })

  it("disables Save until a toggle is changed", async () => {
    mockPreferences(allEnabled)
    renderWithProviders(<NotificationPreferencesSection />)

    await screen.findByLabelText("Mentions in comments")

    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled()
  })

  it("toggles a preference and sends the updated preferences on save", async () => {
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

    const mentionsCheckbox = await screen.findByLabelText("Mentions in comments")
    await user.click(mentionsCheckbox)
    await user.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() =>
      expect(requestBody).toEqual({ ...allEnabled, mentionsEnabled: false })
    )
  })

  it("shows an error toast when saving fails", async () => {
    mockPreferences(allEnabled)
    server.use(
      http.put("*/api/notifications/preferences", () => HttpResponse.error())
    )

    const user = userEvent.setup()
    renderWithProviders(<NotificationPreferencesSection />)

    const mentionsCheckbox = await screen.findByLabelText("Mentions in comments")
    await user.click(mentionsCheckbox)
    await user.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to update notification preferences.",
        expect.anything()
      )
    )
  })
})
