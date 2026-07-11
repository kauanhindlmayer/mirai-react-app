import { describe, expect, it, vi } from "vitest"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { MentionableEditor } from "@/components/common/mentionable-editor"
import { renderWithProviders } from "@/test/test-utils"

describe("MentionableEditor", () => {
  it("calls onChange with the updated HTML as the user types", async () => {
    const handleChange = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(
      <MentionableEditor content="" onChange={handleChange} ariaLabel="Body" />
    )

    const editor = screen.getByRole("textbox", { name: "Body" })
    await user.click(editor)
    await user.type(editor, "Hello")

    expect(handleChange).toHaveBeenLastCalledWith("<p>Hello</p>")
  })

  it("calls onBlur when the editor loses focus", async () => {
    const handleBlur = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(
      <MentionableEditor
        content=""
        onChange={() => {}}
        onBlur={handleBlur}
        ariaLabel="Body"
      />
    )

    const editor = screen.getByRole("textbox", { name: "Body" })
    await user.click(editor)
    expect(handleBlur).not.toHaveBeenCalled()

    await user.tab()

    expect(handleBlur).toHaveBeenCalledTimes(1)
  })

  it("shows a placeholder when empty", () => {
    renderWithProviders(
      <MentionableEditor
        content=""
        placeholder="Add a description..."
        ariaLabel="Body"
      />
    )

    expect(
      screen
        .getByRole("textbox", { name: "Body" })
        .querySelector("[data-placeholder]")
    ).toHaveAttribute("data-placeholder", "Add a description...")
  })

  it("renders read-only content without a role or aria-label", () => {
    renderWithProviders(
      <MentionableEditor content="<p>Read only</p>" editable={false} />
    )

    expect(screen.getByText("Read only")).toBeInTheDocument()
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
  })
})
