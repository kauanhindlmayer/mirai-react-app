import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { KeyboardShortcutsDialog } from "@/components/layout/keyboard-shortcuts-dialog"

describe("KeyboardShortcutsDialog", () => {
  it("renders nothing when closed", () => {
    render(<KeyboardShortcutsDialog open={false} onOpenChange={vi.fn()} />)

    expect(screen.queryByText("Keyboard shortcuts")).not.toBeInTheDocument()
  })

  it("lists the available shortcuts when open", () => {
    render(<KeyboardShortcutsDialog open={true} onOpenChange={vi.fn()} />)

    expect(screen.getByText("Open global search")).toBeInTheDocument()
    expect(screen.getByText("Toggle dark mode")).toBeInTheDocument()
    expect(screen.getByText("Toggle sidebar")).toBeInTheDocument()
    expect(screen.getByText("Open settings")).toBeInTheDocument()
    expect(screen.getByText("Open keyboard shortcuts")).toBeInTheDocument()
  })
})
