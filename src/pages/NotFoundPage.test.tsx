import { describe, expect, it } from "vitest"
import { screen } from "@testing-library/react"

import NotFoundPage from "@/pages/NotFoundPage"
import { renderWithProviders } from "@/test/test-utils"

describe("NotFoundPage", () => {
  it("renders the error heading and message", () => {
    renderWithProviders(<NotFoundPage />)

    expect(screen.getByText("Error")).toBeInTheDocument()
    expect(screen.getByText("Something gone wrong!")).toBeInTheDocument()
  })

  it("links back to home", () => {
    renderWithProviders(<NotFoundPage />)

    expect(screen.getByRole("link", { name: "Go to Home" })).toHaveAttribute(
      "href",
      "/"
    )
  })
})
