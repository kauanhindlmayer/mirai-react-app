import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"
import { screen, waitFor } from "@testing-library/react"

import OrganizationsPage from "@/pages/organizations/OrganizationsPage"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"

describe("OrganizationsPage", () => {
  it("renders each organization linking to its projects", async () => {
    server.use(
      http.get("*/api/organizations", () =>
        HttpResponse.json([
          { id: "org-1", name: "Mirai", description: "Project management" },
        ])
      )
    )

    renderWithProviders(<OrganizationsPage />)

    await waitFor(() => expect(screen.getByText("Mirai")).toBeInTheDocument())
    expect(screen.getByText("Project management")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /mirai/i })).toHaveAttribute(
      "href",
      "/organizations/org-1/projects"
    )
  })

  it("shows an empty-state message when there are no organizations", async () => {
    server.use(http.get("*/api/organizations", () => HttpResponse.json([])))

    renderWithProviders(<OrganizationsPage />)

    await waitFor(() =>
      expect(
        screen.getByText("You don't belong to any organizations yet.")
      ).toBeInTheDocument()
    )
  })

  it("renders the create-organization trigger", () => {
    server.use(http.get("*/api/organizations", () => HttpResponse.json([])))

    renderWithProviders(<OrganizationsPage />)

    expect(
      screen.getByRole("button", { name: /new organization/i })
    ).toBeInTheDocument()
  })
})
