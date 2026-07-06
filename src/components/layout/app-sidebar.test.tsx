import { describe, expect, it, vi } from "vitest"
import { screen } from "@testing-library/react"
import { Route, Routes } from "react-router"

vi.mock("@/hooks/use-current-project", () => ({
  useCurrentProject: () => ({
    projectId: "project-1",
    project: { id: "project-1", name: "Mirai", organizationId: "org-1" },
  }),
}))
vi.mock("@/hooks/use-current-organization", () => ({
  useCurrentOrganization: () => ({
    organization: { id: "org-1", name: "Mirai Inc" },
    organizations: [],
  }),
}))
vi.mock("@/hooks/use-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-auth")>()
  return { ...actual, useCurrentUserQuery: vi.fn() }
})

import { useCurrentUserQuery } from "@/hooks/use-auth"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { ThemeProvider } from "@/components/layout/theme-provider"
import { SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { renderWithProviders } from "@/test/test-utils"

function mockCurrentUser(
  user: Partial<{
    fullName: string
    email: string
    imageUrl: string
  }> = {}
) {
  vi.mocked(useCurrentUserQuery).mockReturnValue({
    data: {
      id: "user-1",
      fullName: "John Doe",
      email: "john@mirai.com",
      imageUrl: "",
      ...user,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any)
}

function renderAppSidebar(route: string) {
  return renderWithProviders(
    <ThemeProvider storageKey="app-sidebar-test">
      <TooltipProvider>
        <SidebarProvider>
          <Routes>
            <Route path="/organizations" element={<AppSidebar />} />
            <Route
              path="/projects/:projectId/summary"
              element={<AppSidebar />}
            />
          </Routes>
        </SidebarProvider>
      </TooltipProvider>
    </ThemeProvider>,
    { route }
  )
}

describe("AppSidebar", () => {
  it("shows the project switcher when a project is selected", () => {
    mockCurrentUser()
    renderAppSidebar("/projects/project-1/summary")

    expect(screen.getByText("Mirai")).toBeInTheDocument()
  })

  it("shows the team switcher when no project is selected", () => {
    mockCurrentUser()
    renderAppSidebar("/organizations")

    expect(screen.getByText("Mirai Inc")).toBeInTheDocument()
  })

  it("passes the current user's name and email to NavUser", () => {
    mockCurrentUser({ fullName: "Jane Smith", email: "jane@mirai.com" })
    renderAppSidebar("/organizations")

    expect(screen.getByText("Jane Smith")).toBeInTheDocument()
    expect(screen.getByText("jane@mirai.com")).toBeInTheDocument()
  })
})
