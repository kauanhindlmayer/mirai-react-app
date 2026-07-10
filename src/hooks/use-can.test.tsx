import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"
import { waitFor } from "@testing-library/react"

import { useCan } from "@/hooks/use-can"
import { server } from "@/test/mocks/server"
import { renderHookWithProviders } from "@/test/test-utils"
import { Permission, RoleScope } from "@/types/roles"

describe("useCan", () => {
  it("returns true once the resource grants the requested permission", async () => {
    server.use(
      http.get("*/api/organizations/org-1/effective-permissions", () =>
        HttpResponse.json(["OrganizationManage", "OrganizationView"])
      )
    )

    const { result } = renderHookWithProviders(() =>
      useCan(RoleScope.Organization, "org-1", Permission.OrganizationManage)
    )

    await waitFor(() => expect(result.current).toBe(true))
  })

  it("returns false when the resource does not grant the permission", async () => {
    server.use(
      http.get("*/api/organizations/org-1/effective-permissions", () =>
        HttpResponse.json(["OrganizationView"])
      )
    )

    const { result } = renderHookWithProviders(() =>
      useCan(
        RoleScope.Organization,
        "org-1",
        Permission.OrganizationManageMembers
      )
    )

    await waitFor(() => expect(result.current).toBe(false))
  })

  it("fails closed (returns false) when resourceId is not yet known", () => {
    const { result } = renderHookWithProviders(() =>
      useCan(RoleScope.Project, undefined, Permission.ProjectManage)
    )

    expect(result.current).toBe(false)
  })
})
