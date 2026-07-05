import { beforeEach, describe, expect, it, vi } from "vitest"
import { http, HttpResponse } from "msw"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Route, Routes } from "react-router"

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>()
  return { ...actual, useSearchParams: vi.fn() }
})

import { useSearchParams } from "react-router"
import BacklogsPage from "@/pages/BacklogsPage"
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
    type: "Bug",
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

function mockBacklog(items: BacklogResponse[]) {
  server.use(
    http.get("*/api/teams/team-1/backlogs", ({ request }) => {
      const url = new URL(request.url)
      expect(url.searchParams.get("backlogLevel")).toBeTruthy()
      return HttpResponse.json(items)
    })
  )
}

function renderBacklogsPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/projects/:projectId/backlogs" element={<BacklogsPage />} />
    </Routes>,
    { route: "/projects/project-1/backlogs" }
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

describe("BacklogsPage", () => {
  it("lists backlog items with their type and status", async () => {
    mockTeams()
    mockBacklog([buildBacklogItem()])
    renderBacklogsPage()

    expect(await screen.findByText("#42 Checkout redesign")).toBeInTheDocument()
    expect(screen.getByText("Bug")).toBeInTheDocument()
    expect(screen.getByText("Active")).toBeInTheDocument()
  })

  it("shows a placeholder when the backlog is empty", async () => {
    mockTeams()
    mockBacklog([])
    renderBacklogsPage()

    expect(
      await screen.findByText("No work items in this backlog.")
    ).toBeInTheDocument()
  })

  it("opens a work item by setting the workItemId search param", async () => {
    mockTeams()
    mockBacklog([buildBacklogItem()])
    const user = userEvent.setup()
    renderBacklogsPage()

    await user.click(await screen.findByText("#42 Checkout redesign"))

    expect(setSearchParams).toHaveBeenCalled()
    const updater = setSearchParams.mock.calls[0][0]
    const next = updater(new URLSearchParams())
    expect(next.get("workItemId")).toBe("item-1")
  })

  it("expands nested children when Expand all is clicked", async () => {
    mockTeams()
    mockBacklog([
      buildBacklogItem({
        children: [buildBacklogItem({ id: "item-2", title: "Sub task" })],
      }),
    ])
    const user = userEvent.setup()
    renderBacklogsPage()

    await screen.findByText("#42 Checkout redesign")
    expect(screen.queryByText("#42 Sub task")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Expand all" }))

    expect(screen.getByText("#42 Sub task")).toBeInTheDocument()
  })

  it("requests the selected backlog level", async () => {
    mockTeams()
    let requestedLevel: string | null = null
    server.use(
      http.get("*/api/teams/team-1/backlogs", ({ request }) => {
        requestedLevel = new URL(request.url).searchParams.get("backlogLevel")
        return HttpResponse.json([])
      })
    )
    const user = userEvent.setup()
    renderBacklogsPage()
    await waitFor(() => expect(requestedLevel).toBe("Feature"))

    await user.click(screen.getAllByRole("combobox")[1])
    await user.click(screen.getByRole("option", { name: "Epic" }))

    await waitFor(() => expect(requestedLevel).toBe("Epic"))
  })
})
