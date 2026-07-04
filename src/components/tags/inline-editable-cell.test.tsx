import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { InlineEditableCell } from "@/components/tags/inline-editable-cell"

describe("InlineEditableCell", () => {
  it("renders the value as a button when not editing", () => {
    render(<InlineEditableCell value="Bug" onSave={vi.fn()} />)

    expect(screen.getByRole("button", { name: "Bug" })).toBeInTheDocument()
  })

  it("renders the placeholder when value is empty", () => {
    render(
      <InlineEditableCell value="" onSave={vi.fn()} placeholder="Untitled" />
    )

    expect(screen.getByRole("button", { name: "Untitled" })).toBeInTheDocument()
  })

  it("switches to an input pre-filled with the value on click", async () => {
    const user = userEvent.setup()
    render(<InlineEditableCell value="Bug" onSave={vi.fn()} />)

    await user.click(screen.getByRole("button", { name: "Bug" }))

    expect(screen.getByRole("textbox")).toHaveValue("Bug")
  })

  it("commits the trimmed value on blur when it changed", async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<InlineEditableCell value="Bug" onSave={onSave} />)

    await user.click(screen.getByRole("button", { name: "Bug" }))
    const input = screen.getByRole("textbox")
    await user.clear(input)
    await user.type(input, "  Feature  ")
    await user.tab()

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith("Feature")
  })

  it("does not commit on blur when the value is unchanged", async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<InlineEditableCell value="Bug" onSave={onSave} />)

    await user.click(screen.getByRole("button", { name: "Bug" }))
    await user.tab()

    expect(onSave).not.toHaveBeenCalled()
  })

  it("reverts the draft and exits editing on Escape without committing", async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<InlineEditableCell value="Bug" onSave={onSave} />)

    await user.click(screen.getByRole("button", { name: "Bug" }))
    const input = screen.getByRole("textbox")
    await user.clear(input)
    await user.type(input, "Feature")
    await user.keyboard("{Escape}")

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByRole("button", { name: "Bug" })).toBeInTheDocument()
  })
})
