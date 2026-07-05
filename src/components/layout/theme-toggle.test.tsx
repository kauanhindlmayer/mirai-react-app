import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it } from "vitest"

import { ThemeProvider } from "@/components/layout/theme-provider"
import { ThemeToggle } from "@/components/layout/theme-toggle"

const STORAGE_KEY = "theme-toggle-test"

function renderThemeToggle() {
  return render(
    <ThemeProvider storageKey={STORAGE_KEY}>
      <ThemeToggle />
    </ThemeProvider>
  )
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove("light", "dark")
  })

  it("renders a toggle button", () => {
    renderThemeToggle()

    expect(
      screen.getByRole("button", { name: "Toggle theme" })
    ).toBeInTheDocument()
  })

  it("lists Light, Dark, and System options when opened", async () => {
    const user = userEvent.setup()
    renderThemeToggle()

    await user.click(screen.getByRole("button", { name: "Toggle theme" }))

    expect(screen.getByRole("menuitem", { name: "Light" })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: "Dark" })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: "System" })).toBeInTheDocument()
  })

  it("persists the selected theme and applies it to the document", async () => {
    const user = userEvent.setup()
    renderThemeToggle()

    await user.click(screen.getByRole("button", { name: "Toggle theme" }))
    await user.click(screen.getByRole("menuitem", { name: "Dark" }))

    expect(localStorage.getItem(STORAGE_KEY)).toBe("dark")
    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })
})
