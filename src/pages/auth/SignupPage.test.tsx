import { describe, expect, it } from "vitest"
import { screen } from "@testing-library/react"

import SignupPage from "@/pages/auth/SignupPage"
import { renderWithProviders } from "@/test/test-utils"

describe("SignupPage", () => {
  it("renders the brand heading and the signup form", () => {
    renderWithProviders(<SignupPage />)

    expect(screen.getByText("Mirai Technologies")).toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /create account/i })
    ).toBeInTheDocument()
  })
})
