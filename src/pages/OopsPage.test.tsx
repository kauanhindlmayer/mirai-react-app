import { describe, expect, it } from "vitest"
import { screen } from "@testing-library/react"

import OopsPage from "@/pages/OopsPage"
import { renderWithProviders } from "@/test/test-utils"

describe("OopsPage", () => {
  it("renders the oops heading and message", () => {
    renderWithProviders(<OopsPage />)

    expect(screen.getByText("Oops!")).toBeInTheDocument()
    expect(screen.getByText("There is nothing here")).toBeInTheDocument()
  })

  it("links back to home", () => {
    renderWithProviders(<OopsPage />)

    expect(screen.getByRole("link", { name: "Go to Home" })).toHaveAttribute(
      "href",
      "/"
    )
  })
})
