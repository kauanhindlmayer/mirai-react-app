import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>()
  return { ...actual, useNavigate: vi.fn() }
})
vi.mock("@/hooks/use-current-project", () => ({
  useCurrentProject: () => ({
    projectId: "project-1",
    project: { id: "project-1", name: "Mirai", organizationId: "org-1" },
  }),
}))

import { useNavigate } from "react-router"
import { ProjectSwitcher } from "@/components/layout/project-switcher"
import { SidebarProvider } from "@/components/ui/sidebar"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"

const navigate = vi.fn()

beforeEach(() => {
  navigate.mockClear()
  vi.mocked(useNavigate).mockReturnValue(navigate)
  server.use(
    http.get("*/api/organizations/org-1/projects", () =>
      HttpResponse.json([
        { id: "project-1", name: "Mirai", organizationId: "org-1" },
        { id: "project-2", name: "Other Project", organizationId: "org-1" },
      ])
    )
  )
})

function renderProjectSwitcher() {
  return renderWithProviders(
    <SidebarProvider>
      <ProjectSwitcher />
    </SidebarProvider>
  )
}

describe("ProjectSwitcher", () => {
  it("renders the current project's name", () => {
    renderProjectSwitcher()

    expect(screen.getByText("Mirai")).toBeInTheDocument()
  })

  it("lists the organization's other projects in the dropdown", async () => {
    const user = userEvent.setup()
    renderProjectSwitcher()

    await user.click(screen.getByText("Mirai"))

    expect(
      screen.getByRole("menuitem", { name: "Other Project" })
    ).toBeInTheDocument()
  })

  it("navigates to a project's summary page when selected", async () => {
    const user = userEvent.setup()
    renderProjectSwitcher()

    await user.click(screen.getByText("Mirai"))
    await user.click(screen.getByRole("menuitem", { name: "Other Project" }))

    expect(navigate).toHaveBeenCalledWith("/projects/project-2/summary")
  })

  it("links to the organization's project list", async () => {
    const user = userEvent.setup()
    renderProjectSwitcher()

    await user.click(screen.getByText("Mirai"))

    expect(
      screen.getByRole("menuitem", { name: /all projects/i })
    ).toHaveAttribute("href", "/organizations/org-1/projects")
  })
})
