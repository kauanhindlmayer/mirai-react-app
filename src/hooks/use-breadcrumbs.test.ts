import { http, HttpResponse } from "msw"
import { describe, expect, it, vi } from "vitest"
import { waitFor } from "@testing-library/react"

vi.mock("@/hooks/use-current-organization", () => ({
  useCurrentOrganization: vi.fn(),
}))
vi.mock("@/hooks/use-current-project", () => ({
  useCurrentProject: vi.fn(),
}))

import { useCurrentOrganization } from "@/hooks/use-current-organization"
import { useCurrentProject } from "@/hooks/use-current-project"
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs"
import { server } from "@/test/mocks/server"
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

  it("does not crash and returns just Organizations for the root path", () => {
    mockContext({})

    const { result } = renderHookWithProviders(() => useBreadcrumbs(), {
      route: "/",
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

  it("uses the wiki page's title instead of its id for a wiki page detail route", async () => {
    mockContext({ projectId: "project-1", project })
    server.use(
      http.get("*/api/projects/project-1/wiki-pages/wiki-page-1", () =>
        HttpResponse.json({
          id: "wiki-page-1",
          projectId: "project-1",
          author: { id: "user-1", name: "John Doe", imageUrl: "" },
          title: "Getting Started",
          content: "",
          comments: [],
          createdAtUtc: "2026-01-01T00:00:00Z",
        })
      )
    )

    const { result } = renderHookWithProviders(() => useBreadcrumbs(), {
      route: "/projects/project-1/wiki-pages/wiki-page-1",
    })

    await waitFor(() =>
      expect(result.current.at(-1)).toEqual({ label: "Getting Started" })
    )
  })

  it("shows a placeholder label while the wiki page title is still loading", () => {
    mockContext({ projectId: "project-1", project })

    const { result } = renderHookWithProviders(() => useBreadcrumbs(), {
      route: "/projects/project-1/wiki-pages/wiki-page-1",
    })

    expect(result.current.at(-1)).toEqual({ label: "Wiki Page" })
  })

  it("still labels the new-wiki-page route as New rather than fetching a title", () => {
    mockContext({ projectId: "project-1", project })

    const { result } = renderHookWithProviders(() => useBreadcrumbs(), {
      route: "/projects/project-1/wiki-pages/new",
    })

    expect(result.current.at(-1)).toEqual({ label: "New" })
  })

  it("uses the retrospective's title instead of its id for a retrospective detail route", async () => {
    mockContext({ projectId: "project-1", project })
    server.use(
      http.get("*/api/retrospectives/retro-1", () =>
        HttpResponse.json({
          id: "retro-1",
          title: "Sprint 12 Retro",
          maxVotesPerUser: 3,
          template: "Classic",
          columns: [],
        })
      )
    )

    const { result } = renderHookWithProviders(() => useBreadcrumbs(), {
      route: "/projects/project-1/retrospectives/retro-1",
    })

    await waitFor(() =>
      expect(result.current.at(-1)).toEqual({ label: "Sprint 12 Retro" })
    )
  })

  it("shows a placeholder label while the retrospective title is still loading", () => {
    mockContext({ projectId: "project-1", project })

    const { result } = renderHookWithProviders(() => useBreadcrumbs(), {
      route: "/projects/project-1/retrospectives/retro-1",
    })

    expect(result.current.at(-1)).toEqual({ label: "Retrospective" })
  })

  it("labels the retrospectives list route as Retrospectives rather than fetching a title", () => {
    mockContext({ projectId: "project-1", project })

    const { result } = renderHookWithProviders(() => useBreadcrumbs(), {
      route: "/projects/project-1/retrospectives",
    })

    expect(result.current.at(-1)).toEqual({ label: "Retrospectives" })
  })
})
