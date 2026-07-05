import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>()
  return { ...actual, useNavigate: vi.fn() }
})

import { useNavigate } from "react-router"
import { useCurrentOrganization } from "@/hooks/use-current-organization"
import { TeamSwitcher } from "@/components/layout/team-switcher"
import { SidebarProvider } from "@/components/ui/sidebar"
import { renderWithProviders } from "@/test/test-utils"
import type { Organization } from "@/types/organizations"

vi.mock("@/hooks/use-current-organization")

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

const navigate = vi.fn()

beforeEach(() => {
  navigate.mockClear()
  vi.mocked(useNavigate).mockReturnValue(navigate)
})

function renderTeamSwitcher() {
  return renderWithProviders(
    <SidebarProvider>
      <TeamSwitcher />
    </SidebarProvider>
  )
}

describe("TeamSwitcher", () => {
  it("prompts to create an organization when none exist", () => {
    vi.mocked(useCurrentOrganization).mockReturnValue({
      organizationId: undefined,
      organization: undefined,
      organizations: [],
      isLoading: false,
    })

    renderTeamSwitcher()

    expect(
      screen.getByRole("link", { name: /create organization/i })
    ).toHaveAttribute("href", "/organizations")
  })

  it("renders the current organization's name", () => {
    vi.mocked(useCurrentOrganization).mockReturnValue({
      organizationId: "org-1",
      organization: buildOrganization(),
      organizations: [buildOrganization()],
      isLoading: false,
    })

    renderTeamSwitcher()

    expect(screen.getByText("Mirai Inc")).toBeInTheDocument()
  })

  it("navigates to another organization's projects when selected", async () => {
    vi.mocked(useCurrentOrganization).mockReturnValue({
      organizationId: "org-1",
      organization: buildOrganization(),
      organizations: [
        buildOrganization(),
        buildOrganization({ id: "org-2", name: "Acme Corp" }),
      ],
      isLoading: false,
    })

    const user = userEvent.setup()
    renderTeamSwitcher()

    await user.click(screen.getByText("Mirai Inc"))
    await user.click(screen.getByRole("menuitem", { name: "Acme Corp" }))

    expect(navigate).toHaveBeenCalledWith("/organizations/org-2/projects")
  })
})
