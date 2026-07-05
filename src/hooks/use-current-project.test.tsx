import { QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router"

import { useCurrentProject } from "@/hooks/use-current-project"
import { server } from "@/test/mocks/server"
import { createTestQueryClient } from "@/test/test-utils"

function renderAtProject(projectId: string) {
  const queryClient = createTestQueryClient()
  return renderHook(() => useCurrentProject(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/projects/${projectId}/summary`]}>
          <Routes>
            <Route
              path="/projects/:projectId/summary"
              element={<>{children}</>}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    ),
  })
}

describe("useCurrentProject", () => {
  it("fetches and returns the project matching the route param", async () => {
    server.use(
      http.get("*/api/projects/project-1", () =>
        HttpResponse.json({
          id: "project-1",
          name: "Mirai",
          description: "",
          organizationId: "org-1",
          createdAtUtc: "2026-01-01T00:00:00Z",
        })
      )
    )

    const { result } = renderAtProject("project-1")

    await waitFor(() => expect(result.current.project?.name).toBe("Mirai"))
    expect(result.current.projectId).toBe("project-1")
  })

  it("exposes an error state when the fetch fails", async () => {
    server.use(
      http.get("*/api/projects/project-1", () =>
        HttpResponse.json({ title: "Not found" }, { status: 404 })
      )
    )

    const { result } = renderAtProject("project-1")

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
