import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactElement } from "react"

import { WorkItemHistory } from "@/components/work-items/work-item-history"
import { WorkItemProvider } from "@/components/work-items/work-item-context"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"
import type { WorkItemChangeSet } from "@/types/work-items"

function renderHistory(ui: ReactElement) {
  return renderWithProviders(
    <WorkItemProvider projectId="project-1" workItemId="work-item-1">
      {ui}
    </WorkItemProvider>
  )
}

function buildChangeSet(
  overrides: Partial<WorkItemChangeSet> = {}
): WorkItemChangeSet {
  return {
    id: "change-set-1",
    changedBy: { id: "user-1", name: "John Doe" },
    changes: [{ fieldName: "Status", oldValue: "New", newValue: "Active" }],
    createdAtUtc: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

describe("WorkItemHistory", () => {
  it("does not fetch history until expanded", async () => {
    let requestCount = 0
    server.use(
      http.get(
        "*/api/projects/project-1/work-items/work-item-1/history",
        () => {
          requestCount += 1
          return HttpResponse.json({
            items: [],
            totalCount: 0,
            page: 1,
            pageSize: 10,
            hasNextPage: false,
            hasPreviousPage: false,
            totalPages: 0,
          })
        }
      )
    )

    renderHistory(<WorkItemHistory />)

    expect(screen.getByRole("button", { name: "History" })).toBeInTheDocument()
    expect(requestCount).toBe(0)
  })

  it("renders change entries after expanding", async () => {
    server.use(
      http.get(
        "*/api/projects/project-1/work-items/work-item-1/history",
        () =>
          HttpResponse.json({
            items: [buildChangeSet()],
            totalCount: 1,
            page: 1,
            pageSize: 10,
            hasNextPage: false,
            hasPreviousPage: false,
            totalPages: 1,
          })
      )
    )

    const user = userEvent.setup()
    renderHistory(<WorkItemHistory />)

    await user.click(screen.getByRole("button", { name: "History" }))

    expect(await screen.findByText("John Doe")).toBeInTheDocument()
    expect(screen.getByText("Status")).toBeInTheDocument()
    expect(screen.getByText("New")).toBeInTheDocument()
    expect(screen.getByText("Active")).toBeInTheDocument()
  })

  it("shows a placeholder when there is no history", async () => {
    server.use(
      http.get(
        "*/api/projects/project-1/work-items/work-item-1/history",
        () =>
          HttpResponse.json({
            items: [],
            totalCount: 0,
            page: 1,
            pageSize: 10,
            hasNextPage: false,
            hasPreviousPage: false,
            totalPages: 0,
          })
      )
    )

    const user = userEvent.setup()
    renderHistory(<WorkItemHistory />)

    await user.click(screen.getByRole("button", { name: "History" }))

    await waitFor(() =>
      expect(screen.getByText("No changes yet.")).toBeInTheDocument()
    )
  })

  it("shows a load more button when another page is available", async () => {
    server.use(
      http.get(
        "*/api/projects/project-1/work-items/work-item-1/history",
        () =>
          HttpResponse.json({
            items: [buildChangeSet()],
            totalCount: 2,
            page: 1,
            pageSize: 10,
            hasNextPage: true,
            hasPreviousPage: false,
            totalPages: 2,
          })
      )
    )

    const user = userEvent.setup()
    renderHistory(<WorkItemHistory />)

    await user.click(screen.getByRole("button", { name: "History" }))

    expect(
      await screen.findByRole("button", { name: "Load more" })
    ).toBeInTheDocument()
  })
})
