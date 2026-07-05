import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Route, Routes } from "react-router"

import { WikiPageTree } from "@/components/wiki-pages/wiki-page-tree"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"
import type { WikiPageSummary } from "@/types/wiki-pages"

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

  it("renders top-level pages as links into the project's wiki", async () => {
    mockPages([buildPage()])
    renderWikiPageTree()

    const link = await screen.findByRole("button", { name: "Getting Started" })
    expect(link.tagName).toBe("A")
    expect(link).toHaveAttribute(
      "href",
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

    const link = await screen.findByRole("button", { name: "Getting Started" })
    expect(link.className).toContain("bg-accent")
  })
})
