import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>()
  return { ...actual, useNavigate: vi.fn() }
})

import { Route, Routes, useNavigate } from "react-router"
import { WikiPageTree } from "@/components/wiki-pages/wiki-page-tree"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"
import type { WikiPageSummary } from "@/types/wiki-pages"

const navigate = vi.fn()

beforeEach(() => {
  navigate.mockClear()
  vi.mocked(useNavigate).mockReturnValue(navigate)
})

function buildPage(overrides: Partial<WikiPageSummary> = {}): WikiPageSummary {
  return {
    id: "page-1",
    title: "Getting Started",
    position: 0,
    ...overrides,
  }
}

function mockPages(pages: WikiPageSummary[]) {
  server.use(
    http.get("*/api/projects/project-1/wiki-pages", () =>
      HttpResponse.json(pages)
    )
  )
}

function renderWikiPageTree(route = "/projects/project-1/wiki-pages") {
  return renderWithProviders(
    <Routes>
      <Route
        path="/projects/:projectId/wiki-pages"
        element={<WikiPageTree />}
      />
      <Route
        path="/projects/:projectId/wiki-pages/:wikiPageId"
        element={<WikiPageTree />}
      />
    </Routes>,
    { route }
  )
}

describe("WikiPageTree", () => {
  it("shows an empty-state message when there are no wiki pages", async () => {
    mockPages([])
    renderWikiPageTree()

    expect(await screen.findByText("No wiki pages yet.")).toBeInTheDocument()
  })

  it("renders top-level pages as rows and navigates on click", async () => {
    mockPages([buildPage()])
    renderWikiPageTree()

    const row = await screen.findByRole("button", { name: "Getting Started" })
    const user = userEvent.setup()
    await user.click(row)

    expect(navigate).toHaveBeenCalledWith(
      "/projects/project-1/wiki-pages/page-1"
    )
  })

  it("navigates when the row is activated with the keyboard", async () => {
    mockPages([buildPage()])
    renderWikiPageTree()

    const row = await screen.findByRole("button", { name: "Getting Started" })
    row.focus()
    const user = userEvent.setup()
    await user.keyboard("{Enter}")

    expect(navigate).toHaveBeenCalledWith(
      "/projects/project-1/wiki-pages/page-1"
    )
  })

  it("links the new-page button to the wiki page creation route", async () => {
    mockPages([])
    renderWikiPageTree()

    expect(
      await screen.findByRole("link", { name: "New wiki page" })
    ).toHaveAttribute("href", "/projects/project-1/wiki-pages/new")
  })

  it("does not show sub-pages until the parent is expanded", async () => {
    mockPages([
      buildPage({
        subPages: [buildPage({ id: "page-2", title: "Nested Page" })],
      }),
    ])
    renderWikiPageTree()

    await screen.findByRole("button", { name: "Getting Started" })
    expect(screen.queryByText("Nested Page")).not.toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: "Expand" }))

    expect(
      screen.getByRole("button", { name: "Nested Page" })
    ).toBeInTheDocument()
  })

  it("highlights the page matching the current route", async () => {
    mockPages([buildPage()])
    renderWikiPageTree("/projects/project-1/wiki-pages/page-1")

    const row = await screen.findByRole("button", { name: "Getting Started" })
    expect(row.className).toContain("bg-accent")
  })
})
