import { beforeEach, describe, expect, it, vi } from "vitest"
import { http, HttpResponse } from "msw"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Route, Routes } from "react-router"

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>()
  return { ...actual, useSearchParams: vi.fn() }
})

import { useSearchParams } from "react-router"
import SprintsPage from "@/pages/SprintsPage"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"
import type { BacklogResponse } from "@/types/teams"

const setSearchParams = vi.fn()

function buildBacklogItem(
  overrides: Partial<BacklogResponse> = {}
): BacklogResponse {
  return {
    id: "item-1",
    code: 42,
    type: "UserStory",
    title: "Checkout redesign",
    status: "Active",
    valueArea: "Business",
    tags: [],
    children: [],
    ...overrides,
  }
}

function mockTeams() {
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
}

function mockSprints(workItemCount = 0) {
  server.use(
    http.get("*/api/teams/team-1/sprints", () =>
      HttpResponse.json([
        {
          id: "sprint-1",
          name: "Sprint 1",
          startDate: "2026-01-01",
          endDate: "2026-01-14",
          workItemCount,
        },
      ])
    )
  )
}

function mockTeamPermissions(permissions: string[]) {
  server.use(
    http.get("*/api/teams/team-1/effective-permissions", () =>
      HttpResponse.json(permissions)
    )
  )
}

function mockBacklog(items: BacklogResponse[]) {
  server.use(
    http.get("*/api/teams/team-1/backlogs", () => HttpResponse.json(items))
  )
}

function renderSprintsPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/projects/:projectId/sprints" element={<SprintsPage />} />
    </Routes>,
    { route: "/projects/project-1/sprints" }
  )
}

beforeEach(() => {
  localStorage.clear()
  setSearchParams.mockClear()
  vi.mocked(useSearchParams).mockReturnValue([
    new URLSearchParams(),
    setSearchParams,
  ])
})

describe("SprintsPage", () => {
  it("shows the first sprint's date range and backlog items", async () => {
    mockTeams()
    mockSprints()
    mockBacklog([buildBacklogItem()])
    renderSprintsPage()

    expect(await screen.findByText("#42 Checkout redesign")).toBeInTheDocument()
    expect(screen.getByText("1 Jan 2026 – 14 Jan 2026")).toBeInTheDocument()
  })

  it("shows a placeholder when there are no sprints", async () => {
    mockTeams()
    server.use(
      http.get("*/api/teams/team-1/sprints", () => HttpResponse.json([]))
    )
    renderSprintsPage()

    expect(
      await screen.findByText("Select or create a sprint to view its backlog.")
    ).toBeInTheDocument()
  })

  it("shows a placeholder when the sprint's backlog is empty", async () => {
    mockTeams()
    mockSprints()
    mockBacklog([])
    renderSprintsPage()

    expect(
      await screen.findByText("No work items in this sprint.")
    ).toBeInTheDocument()
  })

  it("opens a work item by setting the workItemId search param", async () => {
    mockTeams()
    mockSprints()
    mockBacklog([buildBacklogItem()])
    const user = userEvent.setup()
    renderSprintsPage()

    await user.click(await screen.findByText("#42 Checkout redesign"))

    const updater = setSearchParams.mock.calls[0][0]
    const next = updater(new URLSearchParams())
    expect(next.get("workItemId")).toBe("item-1")
  })

  it("shows the New Sprint trigger to someone who can manage sprints", async () => {
    mockTeams()
    mockSprints()
    mockBacklog([])
    mockTeamPermissions(["TeamManageSprints"])
    renderSprintsPage()

    expect(
      await screen.findByRole("button", { name: /new sprint/i })
    ).toBeInTheDocument()
  })

  it("offers the sprint's overflow menu to someone who can manage sprints", async () => {
    mockTeams()
    mockSprints()
    mockBacklog([])
    mockTeamPermissions(["TeamManageSprints"])
    const user = userEvent.setup()
    renderSprintsPage()

    await user.click(
      await screen.findByRole("button", { name: "Sprint actions for Sprint 1" })
    )

    expect(
      await screen.findByRole("menuitem", { name: "Edit" })
    ).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: "Delete" })).toBeInTheDocument()
  })

  it("offers neither sprint action to someone without TeamManageSprints", async () => {
    mockTeams()
    mockSprints()
    mockBacklog([])
    mockTeamPermissions(["TeamView"])
    renderSprintsPage()

    expect(await screen.findByText("Sprint 1")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /sprint actions/i })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /new sprint/i })
    ).not.toBeInTheDocument()
  })

  it("warns how many work items return to the backlog before deleting a sprint", async () => {
    mockTeams()
    mockSprints(5)
    mockBacklog([])
    mockTeamPermissions(["TeamManageSprints"])
    const user = userEvent.setup()
    renderSprintsPage()

    await user.click(
      await screen.findByRole("button", { name: "Sprint actions for Sprint 1" })
    )
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }))

    expect(
      await screen.findByText(/5 work items will be returned to the backlog/)
    ).toBeInTheDocument()
  })
})
