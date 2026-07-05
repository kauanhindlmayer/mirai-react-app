import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { TagColorPicker } from "@/components/tags/tag-color-picker"

describe("TagColorPicker", () => {
  it("renders the trigger swatch with the current color", () => {
    render(<TagColorPicker color="#2a78d6" onChange={vi.fn()} />)

    expect(screen.getByRole("button", { name: "Change color" })).toHaveStyle({
      backgroundColor: "#2a78d6",
    })
  })

  it("calls onChange and closes the popover when a preset is selected", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TagColorPicker color="#2a78d6" onChange={onChange} />)

    await user.click(screen.getByRole("button", { name: "Change color" }))
    await user.click(screen.getByRole("button", { name: "#1baf7a" }))

    expect(onChange).toHaveBeenCalledWith("#1baf7a")
    expect(
      screen.queryByRole("button", { name: "#1baf7a" })
    ).not.toBeInTheDocument()
  })

  it("calls onChange with a typed hex value when Apply is clicked", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TagColorPicker color="#2a78d6" onChange={onChange} />)

    await user.click(screen.getByRole("button", { name: "Change color" }))
    const hexInput = screen.getByDisplayValue("#2a78d6")
    await user.clear(hexInput)
    await user.type(hexInput, "#123456")
    await user.click(screen.getByRole("button", { name: "Apply" }))

    expect(onChange).toHaveBeenCalledWith("#123456")
  })
})
