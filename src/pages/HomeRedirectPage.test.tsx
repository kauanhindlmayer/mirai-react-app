import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { waitFor } from "@testing-library/react"

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>()
  return { ...actual, useNavigate: vi.fn() }
})

import { useNavigate } from "react-router"

import HomeRedirectPage from "@/pages/HomeRedirectPage"
import { organizationsQueryKey } from "@/queries/organizations"
import { server } from "@/test/mocks/server"
import { createTestQueryClient, renderWithProviders } from "@/test/test-utils"

const navigate = vi.fn()

beforeEach(() => {
  navigate.mockClear()
  vi.mocked(useNavigate).mockReturnValue(navigate)
})

describe("HomeRedirectPage", () => {
  it("redirects to the first organization's projects", async () => {
    server.use(
      http.get("*/api/organizations", () =>
        HttpResponse.json([{ id: "org-1", name: "Mirai" }])
      )
    )

    renderWithProviders(<HomeRedirectPage />)

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith("/organizations/org-1/projects", {
        replace: true,
      })
    )
    expect(navigate).toHaveBeenCalledTimes(1)
  })

  it("redirects to the organizations list when there are none", async () => {
    server.use(http.get("*/api/organizations", () => HttpResponse.json([])))

    renderWithProviders(<HomeRedirectPage />)

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith("/organizations", {
        replace: true,
      })
    )
    expect(navigate).toHaveBeenCalledTimes(1)
  })

  it("redirects once even when a stale cached organization list from a previous session gets replaced by a background refetch", async () => {
    server.use(
      http.get("*/api/organizations", () =>
        HttpResponse.json([{ id: "org-2", name: "New Org" }])
      )
    )

    const queryClient = createTestQueryClient()
    queryClient.setQueryData(
      organizationsQueryKey(),
      [{ id: "org-1", name: "Old Org" }],
      { updatedAt: Date.now() - 120_000 }
    )

    renderWithProviders(<HomeRedirectPage />, { queryClient })

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith("/organizations/org-2/projects", {
        replace: true,
      })
    )
    expect(navigate).toHaveBeenCalledTimes(1)
  })
})
