import { http, HttpResponse } from "msw"
import { describe, expect, it, vi } from "vitest"
import { waitFor } from "@testing-library/react"

import { renderHookWithProviders } from "@/test/test-utils"
import { server } from "@/test/mocks/server"

import { useProjectsQuery } from "./projects"

describe("useProjectsQuery", () => {
  it("fetches the organization's projects", async () => {
    server.use(
      http.get("*/api/organizations/org-1/projects", () =>
        HttpResponse.json([{ id: "project-1", name: "Mirai" }])
      )
    )

    const { result } = renderHookWithProviders(() => useProjectsQuery("org-1"))

    await waitFor(() =>
      expect(result.current.data).toEqual([{ id: "project-1", name: "Mirai" }])
    )
  })

  it("does not fetch when organizationId is undefined", () => {
    const handler = vi.fn(() => HttpResponse.json([]))
    server.use(http.get("*/api/organizations/*/projects", handler))

    const { result } = renderHookWithProviders(() =>
      useProjectsQuery(undefined)
    )

    expect(result.current.fetchStatus).toBe("idle")
    expect(handler).not.toHaveBeenCalled()
  })

  it("surfaces a query error when the request fails", async () => {
    server.use(
      http.get("*/api/organizations/org-1/projects", () =>
        HttpResponse.json(
          { title: "Server error", detail: "Something broke" },
          { status: 500 }
        )
      )
    )

    const { result } = renderHookWithProviders(() => useProjectsQuery("org-1"))

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toMatchObject({ message: "Something broke" })
  })
})
