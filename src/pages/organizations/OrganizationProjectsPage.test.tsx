import { http, HttpResponse } from "msw"
import { describe, expect, it, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"

vi.mock("@/hooks/use-current-organization", () => ({
  useCurrentOrganization: () => ({
    organizationId: "org-1",
    organization: { id: "org-1", name: "Mirai" },
  }),
}))

import OrganizationProjectsPage from "@/pages/organizations/OrganizationProjectsPage"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"

describe("OrganizationProjectsPage", () => {
  it("renders the organization name in the heading", async () => {
    server.use(
      http.get("*/api/organizations/org-1/projects", () =>
        HttpResponse.json([])
      )
    )

    renderWithProviders(<OrganizationProjectsPage />)

    expect(screen.getByText("Mirai — Projects")).toBeInTheDocument()
  })

  it("renders each project linking to its summary page", async () => {
    server.use(
      http.get("*/api/organizations/org-1/projects", () =>
        HttpResponse.json([
          { id: "project-1", name: "Website", description: "Marketing site" },
        ])
      )
    )

    renderWithProviders(<OrganizationProjectsPage />)

    await waitFor(() => expect(screen.getByText("Website")).toBeInTheDocument())
    expect(screen.getByText("Marketing site")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /website/i })).toHaveAttribute(
      "href",
      "/projects/project-1/summary"
    )
  })

  it("shows an empty-state message when there are no projects", async () => {
    server.use(
      http.get("*/api/organizations/org-1/projects", () =>
        HttpResponse.json([])
      )
    )

    renderWithProviders(<OrganizationProjectsPage />)

    await waitFor(() =>
      expect(
        screen.getByText("No projects in this organization yet.")
      ).toBeInTheDocument()
    )
  })

  it("shows an error state and retries on demand", async () => {
    server.use(
      http.get("*/api/organizations/org-1/projects", () =>
        HttpResponse.json(
          { title: "Server error", detail: "Something broke" },
          { status: 500 }
        )
      )
    )

    renderWithProviders(<OrganizationProjectsPage />)

    await waitFor(() =>
      expect(screen.getByText("Failed to load projects")).toBeInTheDocument()
    )
    expect(screen.getByText("Something broke")).toBeInTheDocument()
  })
})
