import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ErrorState } from "@/components/common/error-state"

describe("ErrorState", () => {
  it("renders a default title and generic message with no error", () => {
    render(<ErrorState />)

    expect(screen.getByText("Failed to load")).toBeInTheDocument()
    expect(screen.getByText("Something went wrong.")).toBeInTheDocument()
  })

  it("renders a custom title and the error's message", () => {
    render(
      <ErrorState
        title="Failed to load projects"
        error={new Error("Network unreachable")}
      />
    )

    expect(screen.getByText("Failed to load projects")).toBeInTheDocument()
    expect(screen.getByText("Network unreachable")).toBeInTheDocument()
  })

  it("does not render a retry button when onRetry is not provided", () => {
    render(<ErrorState />)

    expect(
      screen.queryByRole("button", { name: /try again/i })
    ).not.toBeInTheDocument()
  })

  it("calls onRetry when the retry button is clicked", async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(<ErrorState onRetry={onRetry} />)

    await user.click(screen.getByRole("button", { name: /try again/i }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
