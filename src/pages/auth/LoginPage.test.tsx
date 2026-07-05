import { describe, expect, it } from "vitest"
import { screen } from "@testing-library/react"

import LoginPage from "@/pages/auth/LoginPage"
import { renderWithProviders } from "@/test/test-utils"

describe("LoginPage", () => {
  it("renders the brand heading and the login form", () => {
    renderWithProviders(<LoginPage />)

    expect(screen.getByText("Mirai Technologies")).toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument()
  })

  it("sets the document title, overriding any stale title from a previous page", () => {
    document.title = "Boards - Acme - Mirai"

    renderWithProviders(<LoginPage />)

    expect(document.title).toBe("Log in - Mirai")
  })
})
