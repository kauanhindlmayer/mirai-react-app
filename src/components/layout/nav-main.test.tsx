import { describe, expect, it } from "vitest"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { NavMain, type NavMainItem } from "@/components/layout/nav-main"
import { SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { renderWithProviders } from "@/test/test-utils"

function buildItems(): NavMainItem[] {
  return [
    {
      title: "Overview",
      items: [{ title: "Summary", url: "/projects/project-1/summary" }],
    },
    {
      title: "Boards",
      items: [{ title: "Work Items", url: "/projects/project-1/work-items" }],
    },
  ]
}

function renderNavMain(items: NavMainItem[], route = "/") {
  return renderWithProviders(
    <TooltipProvider>
      <SidebarProvider>
        <NavMain items={items} />
      </SidebarProvider>
    </TooltipProvider>,
    { route }
  )
}

describe("NavMain", () => {
  it("renders each group's title as a collapsible trigger", () => {
    renderNavMain(buildItems())

    expect(screen.getByRole("button", { name: "Overview" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Boards" })).toBeInTheDocument()
  })

  it("expands a group to reveal its sub-items when clicked", async () => {
    const user = userEvent.setup()
    renderNavMain(buildItems())

    expect(screen.queryByText("Summary")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Overview" }))

    expect(screen.getByText("Summary")).toBeInTheDocument()
  })

  it("starts a group expanded when the current route matches one of its sub-items", () => {
    renderNavMain(buildItems(), "/projects/project-1/summary")

    expect(screen.getByText("Summary")).toBeInTheDocument()
  })
})
