import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { RouteErrorBoundary } from "@/components/layout/route-error-boundary"

function ThrowingComponent(): never {
  throw new Error("Boom")
}

describe("RouteErrorBoundary", () => {
  it("renders its children when nothing throws", () => {
    render(
      <RouteErrorBoundary>
        <div>Content</div>
      </RouteErrorBoundary>
    )

    expect(screen.getByText("Content")).toBeInTheDocument()
  })

  it("renders a fallback with the error message when a child throws", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

    render(
      <RouteErrorBoundary>
        <ThrowingComponent />
      </RouteErrorBoundary>
    )

    expect(screen.getByText("Something went wrong")).toBeInTheDocument()
    expect(screen.getByText("Boom")).toBeInTheDocument()

    consoleError.mockRestore()
  })
})
