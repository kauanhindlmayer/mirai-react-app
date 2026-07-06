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

function mockTeamMembers(
  teamId: string,
  members: { id: string; name: string }[]
) {
  server.use(
    http.get(
      `*/api/projects/project-1/teams/${teamId}/members`,
      ({ request }) => {
        const url = new URL(request.url)
        const page = Number(url.searchParams.get("page") ?? "1")
        const pageSize = Number(url.searchParams.get("pageSize") ?? "10")
        const items = members.slice((page - 1) * pageSize, page * pageSize)
        return HttpResponse.json({
          items,
          totalCount: members.length,
          pageSize,
          page,
          hasNextPage: page * pageSize < members.length,
          hasPreviousPage: page > 1,
          totalPages: Math.max(1, Math.ceil(members.length / pageSize)),
        })
      }
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

  it("shows team members when a team is selected", async () => {
    server.use(
      http.get("*/api/projects/project-1/teams", () =>
        HttpResponse.json([
          {
            id: "team-1",
            name: "Team Alpha",
            boardId: "board-1",
            isDefault: true,
            memberCount: 1,
          },
        ])
      )
    )
    mockTeamMembers("team-1", [{ id: "user-1", name: "John Doe" }])

    const user = userEvent.setup()
    renderWithProviders(<ProjectSettingsPage />)

    await user.click(screen.getByRole("tab", { name: "Teams" }))
    await user.click(await screen.findByText("Team Alpha"))

    expect(await screen.findByText("John Doe")).toBeInTheDocument()
  })

  it("paginates the team members list instead of overflowing", async () => {
    const members = Array.from({ length: 11 }, (_, i) => ({
      id: `user-${i}`,
      name: `Member ${i}`,
    }))
    server.use(
      http.get("*/api/projects/project-1/teams", () =>
        HttpResponse.json([
          {
            id: "team-1",
            name: "Team Alpha",
            boardId: "board-1",
            isDefault: true,
            memberCount: members.length,
          },
        ])
      )
    )
    mockTeamMembers("team-1", members)

    const user = userEvent.setup()
    renderWithProviders(<ProjectSettingsPage />)

    await user.click(screen.getByRole("tab", { name: "Teams" }))
    await user.click(await screen.findByText("Team Alpha"))

    expect(await screen.findByText("Member 0")).toBeInTheDocument()
    expect(screen.queryByText("Member 10")).not.toBeInTheDocument()
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Next" }))

    expect(await screen.findByText("Member 10")).toBeInTheDocument()
    expect(screen.queryByText("Member 0")).not.toBeInTheDocument()
  })

  it("adds an existing project member to a team", async () => {
    mockProjectUsers([
      { id: "user-2", fullName: "Jane Smith", email: "jane@mirai.com" },
    ])
    server.use(
      http.get("*/api/projects/project-1/teams", () =>
        HttpResponse.json([
          {
            id: "team-1",
            name: "Team Alpha",
            boardId: "board-1",
            isDefault: true,
            memberCount: 0,
          },
        ])
      )
    )
    mockTeamMembers("team-1", [])
    let requestBody: unknown
    server.use(
      http.post(
        "*/api/projects/project-1/teams/team-1/members",
        async ({ request }) => {
          requestBody = await request.json()
          return new HttpResponse(null, { status: 204 })
        }
      )
    )

    const user = userEvent.setup()
    renderWithProviders(<ProjectSettingsPage />)

    await user.click(screen.getByRole("tab", { name: "Teams" }))
    await user.click(await screen.findByText("Team Alpha"))
    expect(await screen.findByText("No members yet.")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Add member" }))
    await user.click(await screen.findByText("Jane Smith"))

    await waitFor(() => expect(requestBody).toEqual({ userId: "user-2" }))
  })
})
