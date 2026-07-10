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

const roles = [
  { id: "role-admin", name: "Admin", scope: "Organization" },
  { id: "role-member", name: "Member", scope: "Organization" },
]

function mockMembers(
  items: {
    id: string
    fullName: string
    email: string
    lastActiveAtUtc?: string
    roleId?: string
    roleName?: string
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

function mockPermissions(permissions: string[]) {
  server.use(
    http.get("*/api/organizations/org-1/effective-permissions", () =>
      HttpResponse.json(permissions)
    ),
    http.get("*/api/roles", () => HttpResponse.json(roles))
  )
}

describe("OrganizationSettingsPage", () => {
  it("renders the organization's name in the heading", () => {
    mockPermissions([])
    mockMembers([])
    renderWithProviders(<OrganizationSettingsPage />)

    expect(screen.getByText("Mirai Inc — Settings")).toBeInTheDocument()
  })

  it("lists members with their email and last-active date", async () => {
    mockPermissions([])
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
    mockPermissions([])
    mockMembers([
      { id: "user-1", fullName: "John Doe", email: "john@mirai.com" },
    ])
    renderWithProviders(<OrganizationSettingsPage />)

    expect(await screen.findByText("—")).toBeInTheDocument()
  })

  it("shows an empty state when there are no members", async () => {
    mockPermissions([])
    mockMembers([])
    renderWithProviders(<OrganizationSettingsPage />)

    expect(await screen.findByText("No members yet.")).toBeInTheDocument()
  })

  it("invites a member by email and closes the dialog", async () => {
    mockPermissions([])
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
    mockPermissions([])
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

  it("shows a read-only role badge and no remove action for a caller who cannot manage members", async () => {
    mockPermissions(["OrganizationView"])
    mockMembers([
      {
        id: "user-1",
        fullName: "John Doe",
        email: "john@mirai.com",
        roleId: "role-member",
        roleName: "Contributor",
      },
    ])
    renderWithProviders(<OrganizationSettingsPage />)

    await screen.findByText("John Doe")

    expect(screen.getByText("Contributor")).toBeInTheDocument()
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /remove john doe/i })
    ).not.toBeInTheDocument()
  })

  it("allows a caller with ManageMembers to change a member's role", async () => {
    mockPermissions(["OrganizationManageMembers"])
    mockMembers([
      {
        id: "user-1",
        fullName: "John Doe",
        email: "john@mirai.com",
        roleId: "role-member",
        roleName: "Member",
      },
    ])
    let requestBody: unknown
    server.use(
      http.put(
        "*/api/organizations/org-1/users/user-1/role",
        async ({ request }) => {
          requestBody = await request.json()
          return new HttpResponse(null, { status: 204 })
        }
      )
    )

    const user = userEvent.setup()
    renderWithProviders(<OrganizationSettingsPage />)

    await user.click(await screen.findByRole("combobox"))
    await user.click(await screen.findByRole("option", { name: "Admin" }))

    await waitFor(() =>
      expect(requestBody).toEqual({ roleId: "role-admin" })
    )
  })

  it("allows a caller with ManageMembers to remove a member", async () => {
    mockPermissions(["OrganizationManageMembers"])
    mockMembers([
      {
        id: "user-1",
        fullName: "John Doe",
        email: "john@mirai.com",
        roleId: "role-member",
        roleName: "Member",
      },
    ])
    let removeRequested = false
    server.use(
      http.delete("*/api/organizations/org-1/users/user-1", () => {
        removeRequested = true
        return new HttpResponse(null, { status: 204 })
      })
    )

    const user = userEvent.setup()
    renderWithProviders(<OrganizationSettingsPage />)

    await user.click(
      await screen.findByRole("button", { name: /remove john doe/i })
    )
    await user.click(screen.getByRole("button", { name: /^remove$/i }))

    await waitFor(() => expect(removeRequested).toBe(true))
  })
})
