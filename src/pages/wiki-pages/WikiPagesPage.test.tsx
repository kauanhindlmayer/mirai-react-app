import { describe, expect, it } from "vitest"
import { screen } from "@testing-library/react"
import { Route, Routes } from "react-router"

import WikiPagesPage from "@/pages/wiki-pages/WikiPagesPage"
import { renderWithProviders } from "@/test/test-utils"

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
  it("prompts to select or create a page", () => {
    renderPage("project-1")

    expect(
      screen.getByText("Select a page from the sidebar, or create a new one.")
    ).toBeInTheDocument()
  })

  it("links to the new wiki page route for the current project", () => {
    renderPage("project-1")

    expect(
      screen.getByRole("link", { name: /new wiki page/i })
    ).toHaveAttribute("href", "/projects/project-1/wiki-pages/new")
  })
})
