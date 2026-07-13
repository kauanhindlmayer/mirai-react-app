import { describe, expect, it, vi } from "vitest"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"

import { SettingsDialog } from "@/components/layout/settings-dialog"
import { setAccessToken } from "@/lib/auth-storage"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"

function buildToken(payload: Record<string, unknown>): string {
  return `header.${btoa(JSON.stringify(payload))}.signature`
}

function signIn() {
  setAccessToken(buildToken({ exp: Math.floor(Date.now() / 1000) + 3600 }))
  server.use(
    http.get("*/api/users/me", () =>
      HttpResponse.json({
        id: "user-1",
        email: "john.doe@mirai.com",
        firstName: "John",
        lastName: "Doe",
        fullName: "John Doe",
        imageUrl: "",
      })
    )
  )
}

describe("SettingsDialog", () => {
  it("renders nothing when closed", () => {
    renderWithProviders(<SettingsDialog open={false} onOpenChange={vi.fn()} />)

    expect(screen.queryByText("Settings")).not.toBeInTheDocument()
  })

  it("shows the account form when open", async () => {
    signIn()
    renderWithProviders(<SettingsDialog open={true} onOpenChange={vi.fn()} />)

    expect(screen.getByText("Settings")).toBeInTheDocument()
    expect(await screen.findByLabelText("First Name")).toHaveValue("John")
  })

  it("switches to the notifications pane when its nav item is selected", async () => {
    signIn()
    server.use(
      http.get("*/api/notifications/preferences", () =>
        HttpResponse.json({
          mentionsEnabled: true,
          assignedWorkItemChangesEnabled: false,
          workItemCommentsEnabled: true,
          membershipEnabled: true,
        })
      )
    )

    const user = userEvent.setup()
    renderWithProviders(<SettingsDialog open={true} onOpenChange={vi.fn()} />)

    await user.click(screen.getByRole("tab", { name: "Notifications" }))

    expect(await screen.findByLabelText("Mentions")).toBeChecked()
    expect(screen.queryByLabelText("First Name")).not.toBeInTheDocument()
  })
})
