import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { waitFor } from "@testing-library/react"

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>()
  return { ...actual, useNavigate: vi.fn() }
})

import { useNavigate } from "react-router"

import HomeRedirectPage from "@/pages/HomeRedirectPage"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"

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
  })

  it("redirects to the organizations list when there are none", async () => {
    server.use(
      http.get("*/api/organizations", () => HttpResponse.json([]))
    )

    renderWithProviders(<HomeRedirectPage />)

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith("/organizations", {
        replace: true,
      })
    )
  })
})
