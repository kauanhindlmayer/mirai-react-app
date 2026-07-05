import { http, HttpResponse } from "msw"
import { describe, expect, it, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("@/hooks/use-current-project", () => ({
  useCurrentProject: () => ({
    projectId: "project-1",
    project: {
      id: "project-1",
      name: "Mirai",
      description: "Project management tool",
      organizationId: "org-1",
      createdAtUtc: "2026-01-01T00:00:00Z",
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

import ProjectSettingsPage from "@/pages/projects/ProjectSettingsPage"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"

function mockProjectUsers(
  items: { id: string; fullName: string; email: string }[]
) {
  server.use(
    http.get("*/api/organizations/org-1/projects/project-1/users", () =>
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

function mockOrganizationUsers(
  items: { id: string; fullName: string; email: string }[]
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

describe("ProjectSettingsPage", () => {
  it("renders the project overview form with the current values", () => {
    renderWithProviders(<ProjectSettingsPage />)

    expect(screen.getByDisplayValue("Mirai")).toBeInTheDocument()
    expect(
      screen.getByDisplayValue("Project management tool")
    ).toBeInTheDocument()
  })

  it("lists teams in the Teams tab", async () => {
    server.use(
      http.get("*/api/projects/project-1/teams", () =>
        HttpResponse.json([
          {
            id: "team-1",
            name: "Team Alpha",
            boardId: "board-1",
            isDefault: true,
            memberCount: 3,
          },
        ])
      )
    )

    const user = userEvent.setup()
    renderWithProviders(<ProjectSettingsPage />)

    await user.click(screen.getByRole("tab", { name: "Teams" }))

    expect(await screen.findByText("Team Alpha")).toBeInTheDocument()
  })

  it("lists current members in the Members tab", async () => {
    mockProjectUsers([
      { id: "user-1", fullName: "John Doe", email: "john@mirai.com" },
    ])

    const user = userEvent.setup()
    renderWithProviders(<ProjectSettingsPage />)

    await user.click(screen.getByRole("tab", { name: "Members" }))

    expect(await screen.findByText("John Doe")).toBeInTheDocument()
    expect(screen.getByText("john@mirai.com")).toBeInTheDocument()
  })

  it("adds an existing organization member to the project", async () => {
    mockProjectUsers([])
    mockOrganizationUsers([
      { id: "user-2", fullName: "Jane Smith", email: "jane@mirai.com" },
    ])
    let requestBody: unknown
    server.use(
      http.post(
        "*/api/organizations/org-1/projects/project-1/users",
        async ({ request }) => {
          requestBody = await request.json()
          return new HttpResponse(null, { status: 204 })
        }
      )
    )

    const user = userEvent.setup()
    renderWithProviders(<ProjectSettingsPage />)

    await user.click(screen.getByRole("tab", { name: "Members" }))
    expect(await screen.findByText("No members yet.")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Add member" }))
    await user.click(await screen.findByText("Jane Smith"))

    await waitFor(() => expect(requestBody).toEqual({ userId: "user-2" }))
  })
})
