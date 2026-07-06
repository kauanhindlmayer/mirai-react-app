import { describe, expect, it } from "vitest"
import { screen } from "@testing-library/react"

import { NavMain, type NavMainItem } from "@/components/layout/nav-main"
import { SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { renderWithProviders } from "@/test/test-utils"

function buildItems(): NavMainItem[] {
  return [
    { title: "Summary", url: "/projects/project-1/summary" },
    { title: "Work Items", url: "/projects/project-1/work-items" },
  ]
}

function renderNavMain(items: NavMainItem[], route = "/", title?: string) {
  return renderWithProviders(
    <TooltipProvider>
      <SidebarProvider>
        <NavMain title={title} items={items} />
      </SidebarProvider>
    </TooltipProvider>,
    { route }
  )
}

describe("NavMain", () => {
  it("renders a section title when given one", () => {
    renderNavMain(buildItems(), "/", "Overview")

    expect(screen.getByText("Overview")).toBeInTheDocument()
  })

  it("renders no section title when none is given", () => {
    renderNavMain(buildItems())

    expect(screen.queryByText("Overview")).not.toBeInTheDocument()
  })

  it("renders each item as a link to its url", () => {
    renderNavMain(buildItems())

    expect(screen.getByRole("link", { name: "Summary" })).toHaveAttribute(
      "href",
      "/projects/project-1/summary"
    )
    expect(screen.getByRole("link", { name: "Work Items" })).toHaveAttribute(
      "href",
      "/projects/project-1/work-items"
    )
  })

  it("marks the item matching the current route as active", () => {
    renderNavMain(buildItems(), "/projects/project-1/summary")

    expect(screen.getByRole("link", { name: "Summary" })).toHaveAttribute(
      "data-active",
      "true"
    )
    expect(screen.getByRole("link", { name: "Work Items" })).toHaveAttribute(
      "data-active",
      "false"
    )
  })
})
