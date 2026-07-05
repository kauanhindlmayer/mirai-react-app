import { beforeEach, describe, expect, it, vi } from "vitest"
import { http, HttpResponse } from "msw"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Route, Routes } from "react-router"

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>()
  return { ...actual, useSearchParams: vi.fn() }
})
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

import { useSearchParams } from "react-router"
import { toast } from "sonner"
import WisdomExtractorPage from "@/pages/WisdomExtractorPage"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"

const setSearchParams = vi.fn()

function mockParams(initial: Record<string, string> = {}) {
  vi.mocked(useSearchParams).mockReturnValue([
    new URLSearchParams(initial),
    setSearchParams,
  ])
}

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route
        path="/projects/:projectId/wisdom-extractor"
        element={<WisdomExtractorPage />}
      />
    </Routes>,
    { route: "/projects/project-1/wisdom-extractor" }
  )
}

beforeEach(() => {
  setSearchParams.mockClear()
  vi.mocked(toast.error).mockClear()
  mockParams()
})

describe("WisdomExtractorPage", () => {
  it("renders the heading and prompt without an initial question", () => {
    renderPage()

    expect(screen.getByText("Wisdom Extractor")).toBeInTheDocument()
    expect(screen.queryByText("Search Query")).not.toBeInTheDocument()
  })

  it("asks a question, showing the answer and sources", async () => {
    server.use(
      http.post(
        "*/api/projects/project-1/wisdom-extractor",
        async ({ request }) => {
          const body = (await request.json()) as { question: string }
          expect(body.question).toBe("Why redesign checkout?")
          return HttpResponse.json({
            answer: "Because conversion dropped.",
            sources: [
              {
                id: "work-item-1",
                code: 42,
                title: "Checkout redesign",
                type: "Feature",
                createdAtUtc: "2026-01-01T00:00:00Z",
              },
            ],
          })
        }
      )
    )

    const user = userEvent.setup()
    renderPage()

    await user.type(
      screen.getByPlaceholderText(/checkout redesign/i),
      "Why redesign checkout?"
    )
    await user.click(screen.getByRole("button", { name: "Ask" }))

    expect(
      await screen.findByText("Because conversion dropped.")
    ).toBeInTheDocument()
    expect(screen.getByText("Checkout redesign")).toBeInTheDocument()
  })

  it("shows a message when there are no relevant sources", async () => {
    server.use(
      http.post("*/api/projects/project-1/wisdom-extractor", () =>
        HttpResponse.json({ answer: "No idea.", sources: [] })
      )
    )

    const user = userEvent.setup()
    renderPage()

    await user.type(
      screen.getByPlaceholderText(/checkout redesign/i),
      "Anything?"
    )
    await user.click(screen.getByRole("button", { name: "Ask" }))

    expect(
      await screen.findByText("No relevant sources found.")
    ).toBeInTheDocument()
  })

  it("auto-asks when a q search param is present on mount", async () => {
    let requestCount = 0
    server.use(
      http.post("*/api/projects/project-1/wisdom-extractor", () => {
        requestCount += 1
        return HttpResponse.json({ answer: "Auto answer.", sources: [] })
      })
    )
    mockParams({ q: "What changed recently?" })

    renderPage()

    await waitFor(() => expect(requestCount).toBe(1))
    expect(await screen.findByText("Auto answer.")).toBeInTheDocument()
  })

  it("opens a source work item by setting the workItemId search param", async () => {
    server.use(
      http.post("*/api/projects/project-1/wisdom-extractor", () =>
        HttpResponse.json({
          answer: "Because conversion dropped.",
          sources: [
            {
              id: "work-item-1",
              code: 42,
              title: "Checkout redesign",
              type: "Feature",
              createdAtUtc: "2026-01-01T00:00:00Z",
            },
          ],
        })
      )
    )

    const user = userEvent.setup()
    renderPage()

    await user.type(
      screen.getByPlaceholderText(/checkout redesign/i),
      "Why redesign checkout?"
    )
    await user.click(screen.getByRole("button", { name: "Ask" }))
    await user.click(await screen.findByText("Checkout redesign"))

    const updater = setSearchParams.mock.calls.at(-1)?.[0]
    const next = updater(new URLSearchParams())
    expect(next.get("workItemId")).toBe("work-item-1")
  })

  it("shows an error toast when the request fails", async () => {
    server.use(
      http.post("*/api/projects/project-1/wisdom-extractor", () =>
        HttpResponse.json({ title: "Server error" }, { status: 500 })
      )
    )

    const user = userEvent.setup()
    renderPage()

    await user.type(
      screen.getByPlaceholderText(/checkout redesign/i),
      "Why redesign checkout?"
    )
    await user.click(screen.getByRole("button", { name: "Ask" }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to extract wisdom.",
        expect.objectContaining({ description: "Server error" })
      )
    )
  })
})
