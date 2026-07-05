import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>()
  return { ...actual, useNavigate: vi.fn() }
})

import { Route, Routes, useNavigate } from "react-router"
import { GlobalSearch } from "@/components/layout/global-search"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"

const navigate = vi.fn()
const SEARCH_PLACEHOLDER = "Search pages and work items, or ask a question..."

beforeEach(() => {
  navigate.mockClear()
  vi.mocked(useNavigate).mockReturnValue(navigate)
})

function renderInProject(projectId = "project-1") {
  return renderWithProviders(
    <Routes>
      <Route path="/projects/:projectId/summary" element={<GlobalSearch />} />
    </Routes>,
    { route: `/projects/${projectId}/summary` }
  )
}

describe("GlobalSearch", () => {
  it("renders a Search trigger button", () => {
    renderWithProviders(<GlobalSearch />)

    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument()
  })

  it("toggles the command dialog with the Cmd+K keyboard shortcut", async () => {
    const user = userEvent.setup()
    renderWithProviders(<GlobalSearch />, { route: "/organizations" })

    expect(
      screen.queryByPlaceholderText(SEARCH_PLACEHOLDER)
    ).not.toBeInTheDocument()

    await user.keyboard("{Meta>}k{/Meta}")
    expect(screen.getByPlaceholderText(SEARCH_PLACEHOLDER)).toBeInTheDocument()

    await user.keyboard("{Meta>}k{/Meta}")
    expect(
      screen.queryByPlaceholderText(SEARCH_PLACEHOLDER)
    ).not.toBeInTheDocument()
  })

  it("opens the command dialog and lists page items when clicked", async () => {
    const user = userEvent.setup()
    renderWithProviders(<GlobalSearch />, { route: "/organizations" })

    await user.click(screen.getByRole("button", { name: /search/i }))

    expect(screen.getByPlaceholderText(SEARCH_PLACEHOLDER)).toBeInTheDocument()
    expect(screen.getByText("Organization Settings")).toBeInTheDocument()
  })

  it("navigates to a page item when selected", async () => {
    const user = userEvent.setup()
    renderWithProviders(<GlobalSearch />, { route: "/organizations" })

    await user.click(screen.getByRole("button", { name: /search/i }))
    await user.click(screen.getByText("Organization Settings"))

    expect(navigate).toHaveBeenCalledWith("/organizations")
  })

  it("prompts to open a project when searching outside of a project", async () => {
    const user = userEvent.setup()
    renderWithProviders(<GlobalSearch />, { route: "/organizations" })

    await user.click(screen.getByRole("button", { name: /search/i }))
    await user.type(
      screen.getByPlaceholderText(SEARCH_PLACEHOLDER),
      "nonexistent page"
    )

    expect(
      await screen.findByText("Open a project to search work items.")
    ).toBeInTheDocument()
  })

  it("lists matching work items for the current project", async () => {
    server.use(
      http.get("*/api/projects/project-1/work-items", ({ request }) => {
        const url = new URL(request.url)
        expect(url.searchParams.get("q")).toBe("login")
        return HttpResponse.json({
          items: [
            {
              id: "work-item-1",
              code: 42,
              title: "Fix login bug",
              status: "Active",
              type: "Bug",
              tags: [],
              createdAtUtc: "2026-01-01T00:00:00Z",
            },
          ],
          totalCount: 1,
          pageSize: 5,
          page: 1,
          hasNextPage: false,
          hasPreviousPage: false,
          totalPages: 1,
        })
      })
    )

    const user = userEvent.setup()
    renderInProject()

    await user.click(screen.getByRole("button", { name: /search/i }))
    await user.type(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), "login")

    expect(await screen.findByText("Fix login bug")).toBeInTheDocument()
    expect(screen.getByText("#42")).toBeInTheDocument()
  })

  it("navigates to a matching work item when selected", async () => {
    server.use(
      http.get("*/api/projects/project-1/work-items", () =>
        HttpResponse.json({
          items: [
            {
              id: "work-item-1",
              code: 42,
              title: "Fix login bug",
              status: "Active",
              type: "Bug",
              tags: [],
              createdAtUtc: "2026-01-01T00:00:00Z",
            },
          ],
          totalCount: 1,
          pageSize: 5,
          page: 1,
          hasNextPage: false,
          hasPreviousPage: false,
          totalPages: 1,
        })
      )
    )

    const user = userEvent.setup()
    renderInProject()

    await user.click(screen.getByRole("button", { name: /search/i }))
    await user.type(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), "login")
    await user.click(await screen.findByText("Fix login bug"))

    expect(navigate).toHaveBeenCalledWith(
      "/projects/project-1/work-items?workItemId=work-item-1"
    )
  })

  it("navigates to the Wisdom Extractor when asked", async () => {
    server.use(
      http.get("*/api/projects/project-1/work-items", () =>
        HttpResponse.json({
          items: [],
          totalCount: 0,
          pageSize: 5,
          page: 1,
          hasNextPage: false,
          hasPreviousPage: false,
          totalPages: 1,
        })
      )
    )

    const user = userEvent.setup()
    renderInProject()

    await user.click(screen.getByRole("button", { name: /search/i }))
    await user.type(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), "recent")

    await waitFor(() =>
      expect(screen.getByText('Ask: "recent"')).toBeInTheDocument()
    )
    await user.click(screen.getByText('Ask: "recent"'))

    expect(navigate).toHaveBeenCalledWith(
      "/projects/project-1/wisdom-extractor?q=recent"
    )
  })

  it("navigates to the Wisdom Extractor when Enter is pressed with no matching work items", async () => {
    server.use(
      http.get("*/api/projects/project-1/work-items", () =>
        HttpResponse.json({
          items: [],
          totalCount: 0,
          pageSize: 5,
          page: 1,
          hasNextPage: false,
          hasPreviousPage: false,
          totalPages: 1,
        })
      )
    )

    const user = userEvent.setup()
    renderInProject()

    await user.click(screen.getByRole("button", { name: /search/i }))
    const input = screen.getByPlaceholderText(SEARCH_PLACEHOLDER)
    await user.type(input, "recent")
    await waitFor(() =>
      expect(screen.getByText('Ask: "recent"')).toBeInTheDocument()
    )
    await user.type(input, "{Enter}")

    expect(navigate).toHaveBeenCalledWith(
      "/projects/project-1/wisdom-extractor?q=recent"
    )
  })
})
