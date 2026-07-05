import { describe, expect, it, vi } from "vitest"
import { screen } from "@testing-library/react"
import { Route, Routes } from "react-router"

vi.mock("@/components/work-items/work-item-detail-dialog", () => ({
  WorkItemDetailDialog: () => <p>Work item detail dialog</p>,
}))

import ProjectLayout from "@/components/layout/project-layout"
import { renderWithProviders } from "@/test/test-utils"

describe("ProjectLayout", () => {
  it("renders the matched child route via the outlet", () => {
    renderWithProviders(
      <Routes>
        <Route element={<ProjectLayout />}>
          <Route path="/projects/:projectId/summary" element={<p>Summary</p>} />
        </Route>
      </Routes>,
      { route: "/projects/project-1/summary" }
    )

    expect(screen.getByText("Summary")).toBeInTheDocument()
  })

  it("always mounts the work item detail dialog alongside the outlet", () => {
    renderWithProviders(
      <Routes>
        <Route element={<ProjectLayout />}>
          <Route path="/projects/:projectId/summary" element={<p>Summary</p>} />
        </Route>
      </Routes>,
      { route: "/projects/project-1/summary" }
    )

    expect(screen.getByText("Work item detail dialog")).toBeInTheDocument()
  })
})
