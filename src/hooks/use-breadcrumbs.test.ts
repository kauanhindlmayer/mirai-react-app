import { describe, expect, it, vi } from "vitest"

vi.mock("@/hooks/use-current-organization", () => ({
  useCurrentOrganization: vi.fn(),
}))
vi.mock("@/hooks/use-current-project", () => ({
  useCurrentProject: vi.fn(),
}))

import { useCurrentOrganization } from "@/hooks/use-current-organization"
import { useCurrentProject } from "@/hooks/use-current-project"
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs"
import { renderHookWithProviders } from "@/test/test-utils"
import type { Organization } from "@/types/organizations"
import type { Project } from "@/types/projects"

function mockContext({
  organizationId,
  organization,
  projectId,
  project,
}: {
  organizationId?: string
  organization?: Organization
  projectId?: string
  project?: Project
}) {
  vi.mocked(useCurrentOrganization).mockReturnValue({
    organizationId,
    organization,
    organizations: [],
    isLoading: false,
  })
  vi.mocked(useCurrentProject).mockReturnValue({
    projectId,
    project,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  })
}

const organization: Organization = {
  id: "org-1",
  name: "Mirai Inc",
  description: "",
  createdAtUtc: "2026-01-01T00:00:00Z",
  updatedAtUtc: "2026-01-01T00:00:00Z",
}

const project: Project = {
  id: "project-1",
  name: "Mirai",
  description: "",
  organizationId: "org-1",
  createdAtUtc: "2026-01-01T00:00:00Z",
}

describe("useBreadcrumbs", () => {
  it("returns project breadcrumbs when a project is selected", () => {
    mockContext({ projectId: "project-1", project })

    const { result } = renderHookWithProviders(() => useBreadcrumbs(), {
      route: "/projects/project-1/boards",
    })

    expect(result.current).toEqual([
      { label: "Mirai", href: "/projects/project-1/summary" },
      { label: "Boards" },
    ])
  })

  it("returns organization breadcrumbs when only an organization is selected", () => {
    mockContext({ organizationId: "org-1", organization })

    const { result } = renderHookWithProviders(() => useBreadcrumbs(), {
      route: "/organizations/org-1/settings",
    })

    expect(result.current).toEqual([
      { label: "Organizations", href: "/organizations" },
      { label: "Mirai Inc", href: "/organizations/org-1/projects" },
      { label: "Settings" },
    ])
  })

  it("returns just Organizations when neither is selected", () => {
    mockContext({})

    const { result } = renderHookWithProviders(() => useBreadcrumbs(), {
      route: "/organizations",
    })

    expect(result.current).toEqual([{ label: "Organizations" }])
  })

  it("title-cases an unmapped path segment", () => {
    mockContext({ organizationId: "org-1", organization })

    const { result } = renderHookWithProviders(() => useBreadcrumbs(), {
      route: "/organizations/org-1/something-unmapped",
    })

    expect(result.current.at(-1)).toEqual({ label: "Something-unmapped" })
  })

  it("falls back to a placeholder label while the project is still loading", () => {
    mockContext({ projectId: "project-1", project: undefined })

    const { result } = renderHookWithProviders(() => useBreadcrumbs(), {
      route: "/projects/project-1/summary",
    })

    expect(result.current[0]).toEqual({
      label: "Project",
      href: "/projects/project-1/summary",
    })
  })
})
