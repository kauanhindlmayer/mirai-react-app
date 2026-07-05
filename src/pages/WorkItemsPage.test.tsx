import { beforeEach, describe, expect, it, vi } from "vitest"
import { http, HttpResponse } from "msw"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Route, Routes } from "react-router"

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>()
  return { ...actual, useSearchParams: vi.fn() }
})
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

import { useSearchParams } from "react-router"
import { toast } from "sonner"
import WorkItemsPage from "@/pages/WorkItemsPage"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"
import type { WorkItemSummary } from "@/types/work-items"

const setSearchParams = vi.fn()

function buildWorkItem(
  overrides: Partial<WorkItemSummary> = {}
): WorkItemSummary {
  return {
    id: "work-item-1",
    code: 42,
    title: "Fix login bug",
    status: "Active",
    type: "Bug",
    tags: [],
    createdAtUtc: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

function mockWorkItems(items: WorkItemSummary[]) {
  server.use(
    http.get("*/api/projects/project-1/work-items", () =>
      HttpResponse.json({
        items,
        totalCount: items.length,
        pageSize: 20,
        page: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        totalPages: 1,
      })
    )
  )
}

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route
        path="/projects/:projectId/work-items"
        element={<WorkItemsPage />}
      />
    </Routes>,
    { route: "/projects/project-1/work-items" }
  )
}

beforeEach(() => {
  setSearchParams.mockClear()
  vi.mocked(useSearchParams).mockReturnValue([
    new URLSearchParams(),
    setSearchParams,
  ])
  vi.mocked(toast.success).mockClear()
})

describe("WorkItemsPage", () => {
  it("lists work items with type, status, and assignee", async () => {
    mockWorkItems([
      buildWorkItem({
        assignee: { id: "user-1", name: "John Doe" },
        tags: [{ id: "tag-1", name: "urgent", color: "#ff0000" }],
      }),
    ])
    renderPage()

    expect(await screen.findByText("Fix login bug")).toBeInTheDocument()
    expect(screen.getByText("Bug")).toBeInTheDocument()
    expect(screen.getByText("Active")).toBeInTheDocument()
    expect(screen.getByText("John Doe")).toBeInTheDocument()
    expect(screen.getByText("urgent")).toBeInTheDocument()
  })

  it("shows Unassigned when a work item has no assignee", async () => {
    mockWorkItems([buildWorkItem()])
    renderPage()

    expect(await screen.findByText("Unassigned")).toBeInTheDocument()
  })

  it("shows an empty state when there are no work items", async () => {
    mockWorkItems([])
    renderPage()

    expect(await screen.findByText("No work items yet.")).toBeInTheDocument()
  })

  it("opens a work item by setting the workItemId search param when a row is clicked", async () => {
    mockWorkItems([buildWorkItem()])
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByText("Fix login bug"))

    const updater = setSearchParams.mock.calls[0][0]
    const next = updater(new URLSearchParams())
    expect(next.get("workItemId")).toBe("work-item-1")
  })

  it("requests a sorted list when a sortable column header is clicked", async () => {
    let requestedSort: string | null = null
    server.use(
      http.get("*/api/projects/project-1/work-items", ({ request }) => {
        requestedSort = new URL(request.url).searchParams.get("sort")
        return HttpResponse.json({
          items: [buildWorkItem()],
          totalCount: 1,
          pageSize: 20,
          page: 1,
          hasNextPage: false,
          hasPreviousPage: false,
          totalPages: 1,
        })
      })
    )
    const user = userEvent.setup()
    renderPage()
    await screen.findByText("Fix login bug")

    await user.click(screen.getByText("Title"))

    await waitFor(() => expect(requestedSort).toBe("title"))
  })

  it("deletes a work item from its context menu", async () => {
    mockWorkItems([buildWorkItem()])
    let deleteRequestCount = 0
    server.use(
      http.delete("*/api/projects/project-1/work-items/work-item-1", () => {
        deleteRequestCount += 1
        return new HttpResponse(null, { status: 204 })
      })
    )

    const user = userEvent.setup()
    renderPage()
    const row = (await screen.findByText("Fix login bug")).closest("tr")!
    fireEvent.contextMenu(row)

    await user.click(await screen.findByText("Delete"))

    await waitFor(() => expect(deleteRequestCount).toBe(1))
  })

  it("copies a work item link from its context menu", async () => {
    mockWorkItems([buildWorkItem()])
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined)

    const user = userEvent.setup()
    renderPage()
    const row = (await screen.findByText("Fix login bug")).closest("tr")!
    fireEvent.contextMenu(row)

    await user.click(await screen.findByText("Copy link"))

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        expect.stringContaining("workItemId=work-item-1")
      )
    )
    expect(toast.success).toHaveBeenCalledWith("Link copied.")
  })
})
