import { http, HttpResponse } from "msw"
import { describe, expect, it, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("@/hooks/use-current-organization", () => ({
  useCurrentOrganization: () => ({
    organizationId: "org-1",
    organization: {
      id: "org-1",
      name: "Mirai Inc",
      description: "",
      createdAtUtc: "2026-01-01T00:00:00Z",
      updatedAtUtc: "2026-01-01T00:00:00Z",
    },
    organizations: [],
    isLoading: false,
  }),
}))

import OrganizationSettingsPage from "@/pages/organizations/OrganizationSettingsPage"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"

function mockMembers(
  items: {
    id: string
    fullName: string
    email: string
    lastActiveAtUtc?: string
  }[]
) {
  server.use(
    http.get("*/api/organizations/org-1/users", () =>
      HttpResponse.json({
        items,
        totalCount: items.length,
        pageSize: 10,
        page: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        totalPages: 1,
      })
    )
  )
}

describe("OrganizationSettingsPage", () => {
  it("renders the organization's name in the heading", () => {
    mockMembers([])
    renderWithProviders(<OrganizationSettingsPage />)

    expect(screen.getByText("Mirai Inc — Settings")).toBeInTheDocument()
  })

  it("lists members with their email and last-active date", async () => {
    mockMembers([
      {
        id: "user-1",
        fullName: "John Doe",
        email: "john@mirai.com",
        lastActiveAtUtc: "2026-01-15T00:00:00Z",
      },
    ])
    renderWithProviders(<OrganizationSettingsPage />)

    expect(await screen.findByText("John Doe")).toBeInTheDocument()
    expect(screen.getByText("john@mirai.com")).toBeInTheDocument()
    expect(
      screen.getByText(new Date("2026-01-15T00:00:00Z").toLocaleDateString())
    ).toBeInTheDocument()
  })

  it("shows an em dash when a member has never been active", async () => {
    mockMembers([
      { id: "user-1", fullName: "John Doe", email: "john@mirai.com" },
    ])
    renderWithProviders(<OrganizationSettingsPage />)

    expect(await screen.findByText("—")).toBeInTheDocument()
  })

  it("shows an empty state when there are no members", async () => {
    mockMembers([])
    renderWithProviders(<OrganizationSettingsPage />)

    expect(await screen.findByText("No members yet.")).toBeInTheDocument()
  })

  it("invites a member by email and closes the dialog", async () => {
    mockMembers([])
    let requestBody: unknown
    server.use(
      http.post("*/api/organizations/org-1/users", async ({ request }) => {
        requestBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      })
    )

    const user = userEvent.setup()
    renderWithProviders(<OrganizationSettingsPage />)

    await user.click(screen.getByRole("button", { name: /invite member/i }))
    await user.type(screen.getByLabelText("Email"), "jane@mirai.com")
    await user.click(screen.getByRole("button", { name: "Invite" }))

    await waitFor(() =>
      expect(requestBody).toEqual({ email: "jane@mirai.com" })
    )
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument()
  })

  it("shows a validation error for an invalid email", async () => {
    mockMembers([])
    const user = userEvent.setup()
    renderWithProviders(<OrganizationSettingsPage />)

    await user.click(screen.getByRole("button", { name: /invite member/i }))
    await user.type(screen.getByLabelText("Email"), "not-an-email")
    await user.click(screen.getByRole("button", { name: "Invite" }))

    expect(
      await screen.findByText("Enter a valid email address.")
    ).toBeInTheDocument()
  })
})
