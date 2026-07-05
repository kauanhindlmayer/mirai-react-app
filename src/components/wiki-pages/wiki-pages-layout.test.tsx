import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"
import { screen } from "@testing-library/react"
import { Route, Routes } from "react-router"

import WikiPagesLayout from "@/components/wiki-pages/wiki-pages-layout"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"

describe("WikiPagesLayout", () => {
  it("renders the wiki page tree alongside the matched child route", async () => {
    server.use(
      http.get("*/api/projects/project-1/wiki-pages", () =>
        HttpResponse.json([{ id: "page-1", title: "Home", position: 0 }])
      )
    )
    renderWithProviders(
      <Routes>
        <Route element={<WikiPagesLayout />}>
          <Route
            path="/projects/:projectId/wiki-pages"
            element={<p>Page list</p>}
          />
        </Route>
      </Routes>,
      { route: "/projects/project-1/wiki-pages" }
    )

    expect(await screen.findByText("Home")).toBeInTheDocument()
    expect(screen.getByText("Page list")).toBeInTheDocument()
  })
})
