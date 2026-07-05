import { http, HttpResponse } from "msw"
import { describe, expect, it, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Route, Routes } from "react-router"

import PersonasPage from "@/pages/PersonasPage"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"

function renderPage(projectId: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/projects/:projectId/personas" element={<PersonasPage />} />
    </Routes>,
    { route: `/projects/${projectId}/personas` }
  )
}

describe("PersonasPage", () => {
  it("renders each persona's name", async () => {
    server.use(
      http.get("*/api/projects/project-1/personas", () =>
        HttpResponse.json([
          { id: "persona-1", name: "Busy Barista", imageUrl: "" },
        ])
      )
    )

    renderPage("project-1")

    await waitFor(() =>
      expect(screen.getByText("Busy Barista")).toBeInTheDocument()
    )
  })

  it("shows an empty-state message when there are no personas", async () => {
    server.use(
      http.get("*/api/projects/project-1/personas", () =>
        HttpResponse.json([])
      )
    )

    renderPage("project-1")

    await waitFor(() =>
      expect(screen.getByText("No personas yet")).toBeInTheDocument()
    )
  })

  it("shows an error state and retries on demand", async () => {
    const handler = vi.fn(() =>
      HttpResponse.json(
        { title: "Server error", detail: "Something broke" },
        { status: 500 }
      )
    )
    server.use(http.get("*/api/projects/project-1/personas", handler))

    renderPage("project-1")

    await waitFor(() =>
      expect(screen.getByText("Failed to load personas")).toBeInTheDocument()
    )
    expect(screen.getByText("Something broke")).toBeInTheDocument()

    server.use(
      http.get("*/api/projects/project-1/personas", () =>
        HttpResponse.json([])
      )
    )
    await userEvent.click(screen.getByRole("button", { name: /try again/i }))

    await waitFor(() =>
      expect(screen.getByText("No personas yet")).toBeInTheDocument()
    )
  })
})
