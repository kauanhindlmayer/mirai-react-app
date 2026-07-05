import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Route, Routes } from "react-router"

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>()
  return { ...actual, useNavigate: vi.fn() }
})

import { useNavigate } from "react-router"

import WikiPageViewPage from "@/pages/wiki-pages/WikiPageViewPage"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"
import type { WikiPage } from "@/types/wiki-pages"

const navigate = vi.fn()

function buildWikiPage(overrides: Partial<WikiPage> = {}): WikiPage {
  return {
    id: "wiki-1",
    projectId: "project-1",
    title: "Getting started",
    content: "<p>Hello</p>",
    author: { id: "user-1", name: "Jane Doe", imageUrl: "" },
    comments: [],
    createdAtUtc: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route
        path="/projects/:projectId/wiki-pages/:wikiPageId"
        element={<WikiPageViewPage />}
      />
    </Routes>,
    { route: "/projects/project-1/wiki-pages/wiki-1" }
  )
}

beforeEach(() => {
  navigate.mockClear()
  vi.mocked(useNavigate).mockReturnValue(navigate)
})

describe("WikiPageViewPage", () => {
  it("renders the page title and author once loaded", async () => {
    server.use(
      http.get("*/api/projects/project-1/wiki-pages/wiki-1", () =>
        HttpResponse.json(buildWikiPage())
      )
    )

    renderPage()

    await waitFor(() =>
      expect(screen.getByText("Getting started")).toBeInTheDocument()
    )
    expect(screen.getByText("Jane Doe")).toBeInTheDocument()
  })

  it("links the edit button to the edit route", async () => {
    server.use(
      http.get("*/api/projects/project-1/wiki-pages/wiki-1", () =>
        HttpResponse.json(buildWikiPage())
      )
    )

    renderPage()

    await waitFor(() =>
      expect(screen.getByRole("link", { name: /edit/i })).toHaveAttribute(
        "href",
        "/projects/project-1/wiki-pages/wiki-1/edit"
      )
    )
  })

  it("shows an error state when the wiki page fails to load", async () => {
    server.use(
      http.get("*/api/projects/project-1/wiki-pages/wiki-1", () =>
        HttpResponse.json(
          { title: "Not found", detail: "Wiki page not found" },
          { status: 404 }
        )
      )
    )

    renderPage()

    await waitFor(() =>
      expect(screen.getByText("Failed to load wiki page")).toBeInTheDocument()
    )
  })

  it("navigates to the wiki page list after deleting", async () => {
    const user = userEvent.setup()
    server.use(
      http.get("*/api/projects/project-1/wiki-pages/wiki-1", () =>
        HttpResponse.json(buildWikiPage())
      ),
      http.delete("*/api/projects/project-1/wiki-pages/wiki-1", () =>
        HttpResponse.json(null, { status: 204 })
      )
    )

    renderPage()

    await user.click(await screen.findByRole("button", { name: /delete/i }))
    const deleteButtons = await screen.findAllByRole("button", {
      name: /delete/i,
    })
    await user.click(deleteButtons[deleteButtons.length - 1])

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith("/projects/project-1/wiki-pages")
    )
  })
})
