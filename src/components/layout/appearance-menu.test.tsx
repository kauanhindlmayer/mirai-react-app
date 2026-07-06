import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it } from "vitest"

import { AppearanceMenu } from "@/components/layout/appearance-menu"
import { ThemeProvider } from "@/components/layout/theme-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const STORAGE_KEY = "appearance-menu-test"

function renderAppearanceMenu() {
  return render(
    <ThemeProvider storageKey={STORAGE_KEY}>
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <AppearanceMenu />
        </DropdownMenuContent>
      </DropdownMenu>
    </ThemeProvider>
  )
}

describe("AppearanceMenu", () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove("light", "dark")
  })

  it("lists Light, Dark, and System options", async () => {
    const user = userEvent.setup()
    renderAppearanceMenu()

    await user.click(screen.getByRole("menuitem", { name: /appearance/i }))

    expect(
      await screen.findByRole("menuitemcheckbox", { name: /light/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("menuitemcheckbox", { name: /dark/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("menuitemcheckbox", { name: /system/i })
    ).toBeInTheDocument()
  })

  it("marks the current theme as checked", async () => {
    localStorage.setItem(STORAGE_KEY, "dark")
    const user = userEvent.setup()
    renderAppearanceMenu()

    await user.click(screen.getByRole("menuitem", { name: /appearance/i }))

    expect(
      await screen.findByRole("menuitemcheckbox", { name: /dark/i })
    ).toHaveAttribute("data-state", "checked")
    expect(
      screen.getByRole("menuitemcheckbox", { name: /light/i })
    ).toHaveAttribute("data-state", "unchecked")
  })
})
