import { describe, expect, it, vi } from "vitest"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { RemoveMemberButton } from "@/components/authorization/remove-member-button"
import { renderWithProviders } from "@/test/test-utils"

describe("RemoveMemberButton", () => {
  it("asks for confirmation before calling onConfirm", async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup()

    renderWithProviders(
      <RemoveMemberButton memberName="Jane Smith" onConfirm={onConfirm} />
    )

    await user.click(screen.getByRole("button", { name: /remove jane smith/i }))

    expect(onConfirm).not.toHaveBeenCalled()
    expect(
      screen.getByRole("heading", { name: /remove jane smith\?/i })
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /^remove$/i }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it("does not call onConfirm when the dialog is cancelled", async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup()

    renderWithProviders(
      <RemoveMemberButton memberName="Jane Smith" onConfirm={onConfirm} />
    )

    await user.click(screen.getByRole("button", { name: /remove jane smith/i }))
    await user.click(screen.getByRole("button", { name: /cancel/i }))

    expect(onConfirm).not.toHaveBeenCalled()
    expect(
      screen.queryByRole("heading", { name: /remove jane smith\?/i })
    ).not.toBeInTheDocument()
  })

  it("disables the trigger button when disabled", () => {
    renderWithProviders(
      <RemoveMemberButton memberName="Jane Smith" onConfirm={vi.fn()} disabled />
    )

    expect(
      screen.getByRole("button", { name: /remove jane smith/i })
    ).toBeDisabled()
  })
})
