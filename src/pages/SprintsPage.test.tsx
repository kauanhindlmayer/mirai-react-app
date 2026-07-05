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

function mockSprints() {
  server.use(
    http.get("*/api/teams/team-1/sprints", () =>
      HttpResponse.json([
        {
          id: "sprint-1",
          name: "Sprint 1",
          startDate: "2026-01-01T00:00:00Z",
          endDate: "2026-01-14T00:00:00Z",
        },
      ])
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
    const formatDate = (value: string) =>
      new Date(value).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
      })
    expect(
      screen.getByText(
        `${formatDate("2026-01-01T00:00:00Z")} – ${formatDate("2026-01-14T00:00:00Z")}`
      )
    ).toBeInTheDocument()
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

  it("shows the New Sprint trigger once a team is loaded", async () => {
    mockTeams()
    mockSprints()
    mockBacklog([])
    renderSprintsPage()

    expect(
      await screen.findByRole("button", { name: /new sprint/i })
    ).toBeInTheDocument()
  })
})
