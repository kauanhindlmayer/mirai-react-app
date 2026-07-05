import { QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router"

import { useCurrentOrganization } from "@/hooks/use-current-organization"
import { server } from "@/test/mocks/server"
import { createTestQueryClient } from "@/test/test-utils"
import type { Organization } from "@/types/organizations"

function buildOrganization(
  overrides: Partial<Organization> = {}
): Organization {
  return {
    id: "org-1",
    name: "Mirai Inc",
    description: "",
    createdAtUtc: "2026-01-01T00:00:00Z",
    updatedAtUtc: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

function renderAtOrganization(organizationId: string) {
  const queryClient = createTestQueryClient()
  return renderHook(() => useCurrentOrganization(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter
          initialEntries={[`/organizations/${organizationId}/projects`]}
        >
          <Routes>
            <Route
              path="/organizations/:organizationId/projects"
              element={<>{children}</>}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    ),
  })
}

describe("useCurrentOrganization", () => {
  it("finds the organization matching the route param", async () => {
    server.use(
      http.get("*/api/organizations", () =>
        HttpResponse.json([
          buildOrganization(),
          buildOrganization({ id: "org-2", name: "Acme" }),
        ])
      )
    )

    const { result } = renderAtOrganization("org-1")

    await waitFor(() =>
      expect(result.current.organization?.name).toBe("Mirai Inc")
    )
    expect(result.current.organizationId).toBe("org-1")
    expect(result.current.organizations).toHaveLength(2)
  })

  it("returns an undefined organization when the id doesn't match any", async () => {
    server.use(
      http.get("*/api/organizations", () =>
        HttpResponse.json([buildOrganization({ id: "org-2", name: "Acme" })])
      )
    )

    const { result } = renderAtOrganization("org-1")

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.organization).toBeUndefined()
  })
})
