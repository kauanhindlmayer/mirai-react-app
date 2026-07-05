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
    },
  }),
}))

import ProjectSummaryPage from "@/pages/projects/ProjectSummaryPage"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"

function mockStats(periodInDays: number, workItemsCreated: number) {
  server.use(
    http.get("*/api/projects/project-1/work-items/stats", ({ request }) => {
      const url = new URL(request.url)
      expect(url.searchParams.get("periodInDays")).toBe(periodInDays.toString())
      return HttpResponse.json({
        workItemsCreated,
        workItemsCompleted: workItemsCreated - 1,
      })
    })
  )
}

function mockMembers(items: { id: string; fullName: string; email: string }[]) {
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

describe("ProjectSummaryPage", () => {
  it("renders the project's name and description", () => {
    mockStats(7, 5)
    mockMembers([])
    renderWithProviders(<ProjectSummaryPage />)

    expect(screen.getByText("Mirai — Summary")).toBeInTheDocument()
    expect(screen.getByText("Project management tool")).toBeInTheDocument()
  })

  it("shows the work item stats once loaded", async () => {
    mockStats(7, 5)
    mockMembers([])
    renderWithProviders(<ProjectSummaryPage />)

    expect(await screen.findByText("5")).toBeInTheDocument()
    expect(screen.getByText("4")).toBeInTheDocument()
  })

  it("shows an error message when stats fail to load", async () => {
    mockMembers([])
    server.use(
      http.get("*/api/projects/project-1/work-items/stats", () =>
        HttpResponse.json({ title: "Server error" }, { status: 500 })
      )
    )
    renderWithProviders(<ProjectSummaryPage />)

    expect(await screen.findAllByText("Failed to load")).toHaveLength(2)
  })

  it("lists recent members", async () => {
    mockStats(7, 5)
    mockMembers([
      { id: "user-1", fullName: "John Doe", email: "john@mirai.com" },
    ])
    renderWithProviders(<ProjectSummaryPage />)

    expect(await screen.findByText("John Doe")).toBeInTheDocument()
    expect(screen.getByText("john@mirai.com")).toBeInTheDocument()
  })

  it("shows a placeholder when there are no members", async () => {
    mockStats(7, 5)
    mockMembers([])
    renderWithProviders(<ProjectSummaryPage />)

    expect(await screen.findByText("No members yet.")).toBeInTheDocument()
  })

  it("refetches stats for the selected period", async () => {
    mockStats(7, 5)
    mockMembers([])
    const user = userEvent.setup()
    renderWithProviders(<ProjectSummaryPage />)
    await screen.findByText("5")

    mockStats(30, 42)
    await user.click(screen.getByRole("combobox"))
    await user.click(screen.getByRole("option", { name: "Last 30 days" }))

    await waitFor(() => expect(screen.getByText("42")).toBeInTheDocument())
  })
})
