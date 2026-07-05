import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { KeyboardShortcutsDialog } from "@/components/layout/keyboard-shortcuts-dialog"

describe("KeyboardShortcutsDialog", () => {
  it("renders a trigger button", () => {
    render(<KeyboardShortcutsDialog />)

    expect(
      screen.getByRole("button", { name: "Keyboard shortcuts" })
    ).toBeInTheDocument()
  })

  it("lists the available shortcuts when opened", async () => {
    const user = userEvent.setup()
    render(<KeyboardShortcutsDialog />)

    await user.click(screen.getByRole("button", { name: "Keyboard shortcuts" }))

    expect(screen.getByText("Open global search")).toBeInTheDocument()
    expect(screen.getByText("Toggle dark mode")).toBeInTheDocument()
    expect(screen.getByText("K")).toBeInTheDocument()
    expect(screen.getByText("D")).toBeInTheDocument()
  })
})
