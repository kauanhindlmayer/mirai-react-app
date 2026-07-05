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

import WikiPageNewPage from "@/pages/wiki-pages/WikiPageNewPage"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"

const navigate = vi.fn()

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route
        path="/projects/:projectId/wiki-pages/new"
        element={<WikiPageNewPage />}
      />
    </Routes>,
    { route: "/projects/project-1/wiki-pages/new" }
  )
}

beforeEach(() => {
  navigate.mockClear()
  vi.mocked(useNavigate).mockReturnValue(navigate)
})

describe("WikiPageNewPage", () => {
  it("disables the create button until a title is entered", async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.getByRole("button", { name: "Create" })).toBeDisabled()

    await user.type(screen.getByPlaceholderText("Page title"), "New page")

    expect(screen.getByRole("button", { name: "Create" })).toBeEnabled()
  })

  it("creates the page and navigates to it", async () => {
    const user = userEvent.setup()
    server.use(
      http.post("*/api/projects/project-1/wiki-pages", () =>
        HttpResponse.json("wiki-2")
      )
    )

    renderPage()

    await user.type(screen.getByPlaceholderText("Page title"), "New page")
    await user.click(screen.getByRole("button", { name: "Create" }))

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith(
        "/projects/project-1/wiki-pages/wiki-2"
      )
    )
  })
})
