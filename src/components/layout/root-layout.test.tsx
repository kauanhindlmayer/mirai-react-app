import { describe, expect, it, vi } from "vitest"
import { screen } from "@testing-library/react"
import { Route, Routes } from "react-router"

vi.mock("@/components/layout/app-sidebar", () => ({
  AppSidebar: () => <p>App sidebar</p>,
}))
vi.mock("@/components/layout/global-search", () => ({
  GlobalSearch: () => <p>Global search</p>,
}))
vi.mock("@/components/layout/keyboard-shortcuts-dialog", () => ({
  KeyboardShortcutsDialog: () => <p>Keyboard shortcuts</p>,
}))
vi.mock("@/components/layout/theme-toggle", () => ({
  ThemeToggle: () => <p>Theme toggle</p>,
}))
vi.mock("@/hooks/use-current-project", () => ({
  useCurrentProject: () => ({
    projectId: "project-1",
    project: { id: "project-1", name: "Acme" },
  }),
}))
vi.mock("@/hooks/use-current-organization", () => ({
  useCurrentOrganization: () => ({
    organizationId: undefined,
    organization: undefined,
    organizations: [],
  }),
}))

import RootLayout, { clientMiddleware } from "@/components/layout/root-layout"
import { requireAuth } from "@/lib/auth-middleware"
import { renderWithProviders } from "@/test/test-utils"

function renderRootLayout(route: string) {
  return renderWithProviders(
    <Routes>
      <Route element={<RootLayout />}>
        <Route
          path="/projects/:projectId/summary"
          element={<p>Summary content</p>}
        />
      </Route>
    </Routes>,
    { route }
  )
}

describe("RootLayout", () => {
  it("wires requireAuth as its client middleware", () => {
    expect(clientMiddleware).toEqual([requireAuth])
  })

  it("renders the matched child route via the outlet", () => {
    renderRootLayout("/projects/project-1/summary")

    expect(screen.getByText("Summary content")).toBeInTheDocument()
  })

  it("builds breadcrumbs from the current project and route", () => {
    renderRootLayout("/projects/project-1/summary")

    expect(screen.getByText("Acme")).toBeInTheDocument()
    expect(screen.getByText("Summary")).toBeInTheDocument()
  })

  it("sets the document title from the breadcrumb trail", () => {
    renderRootLayout("/projects/project-1/summary")

    expect(document.title).toBe("Summary - Acme - Mirai")
  })

  it("renders the sidebar, search, and header actions", () => {
    renderRootLayout("/projects/project-1/summary")

    expect(screen.getByText("App sidebar")).toBeInTheDocument()
    expect(screen.getByText("Global search")).toBeInTheDocument()
    expect(screen.getByText("Keyboard shortcuts")).toBeInTheDocument()
    expect(screen.getByText("Theme toggle")).toBeInTheDocument()
  })
})
