import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import { Route, Routes } from "react-router"

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>()
  return { ...actual, useNavigate: vi.fn() }
})

import { useNavigate } from "react-router"
import WikiPagesPage from "@/pages/wiki-pages/WikiPagesPage"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"

const navigate = vi.fn()

beforeEach(() => {
  navigate.mockClear()
  vi.mocked(useNavigate).mockReturnValue(navigate)
})

function renderPage(projectId: string) {
  return renderWithProviders(
    <Routes>
      <Route
        path="/projects/:projectId/wiki-pages"
        element={<WikiPagesPage />}
      />
    </Routes>,
    { route: `/projects/${projectId}/wiki-pages` }
  )
}

describe("WikiPagesPage", () => {
  it("redirects to the first wiki page when there is at least one", async () => {
    server.use(
      http.get("*/api/projects/project-1/wiki-pages", () =>
        HttpResponse.json([
          { id: "page-1", title: "Getting Started", position: 0 },
          { id: "page-2", title: "Architecture", position: 1 },
        ])
      )
    )

    renderPage("project-1")

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith(
        "/projects/project-1/wiki-pages/page-1",
        { replace: true }
      )
    )
    expect(navigate).toHaveBeenCalledTimes(1)
  })

  it("prompts to select or create a page when there are none", async () => {
    server.use(
      http.get("*/api/projects/project-1/wiki-pages", () =>
        HttpResponse.json([])
      )
    )

    renderPage("project-1")

    expect(
      await screen.findByText(
        "Select a page from the sidebar, or create a new one."
      )
    ).toBeInTheDocument()
    expect(navigate).not.toHaveBeenCalled()
  })

  it("links to the new wiki page route for the current project", async () => {
    server.use(
      http.get("*/api/projects/project-1/wiki-pages", () =>
        HttpResponse.json([])
      )
    )

    renderPage("project-1")

    expect(
      await screen.findByRole("link", { name: /new wiki page/i })
    ).toHaveAttribute("href", "/projects/project-1/wiki-pages/new")
  })
})
