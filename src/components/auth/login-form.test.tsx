import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>()
  return { ...actual, useNavigate: vi.fn() }
})
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

import { useNavigate } from "react-router"
import { toast } from "sonner"

import { LoginForm } from "@/components/auth/login-form"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"

const navigate = vi.fn()

beforeEach(() => {
  localStorage.clear()
  navigate.mockClear()
  vi.mocked(useNavigate).mockReturnValue(navigate)
  vi.mocked(toast.error).mockClear()
})

describe("LoginForm", () => {
  it("shows validation errors when submitted empty", async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginForm />)

    await user.click(screen.getByRole("button", { name: "Login" }))

    expect(
      await screen.findByText("Enter a valid email address.")
    ).toBeInTheDocument()
    expect(screen.getByText("Password is required.")).toBeInTheDocument()
  })

  it("shows a validation error for a malformed but non-empty email", async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginForm />)

    await user.type(screen.getByLabelText(/email/i), "not-an-email")
    await user.click(screen.getByRole("button", { name: "Login" }))

    expect(
      await screen.findByText("Enter a valid email address.")
    ).toBeInTheDocument()
  })

  it("logs in and navigates home on success", async () => {
    server.use(
      http.post("*/api/users/login", () =>
        HttpResponse.json({ accessToken: "token-abc" })
      ),
      http.get("*/api/users/me", () =>
        HttpResponse.json({
          id: "1",
          email: "john.doe@mirai.com",
          firstName: "John",
          lastName: "Doe",
          fullName: "John Doe",
          imageUrl: "",
        })
      )
    )

    const user = userEvent.setup()
    renderWithProviders(<LoginForm />)

    await user.type(screen.getByLabelText(/email/i), "john.doe@mirai.com")
    await user.type(screen.getByLabelText(/password/i), "Password123")
    await user.click(screen.getByRole("button", { name: "Login" }))

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/"))
  })

  it("shows an error toast on failed login without redirecting to /login", async () => {
    server.use(
      http.post("*/api/users/login", () =>
        HttpResponse.json(
          { title: "Authentication with the provided credentials failed." },
          { status: 401 }
        )
      )
    )

    const user = userEvent.setup()
    renderWithProviders(<LoginForm />)

    await user.type(screen.getByLabelText(/email/i), "john.doe@mirai.com")
    await user.type(screen.getByLabelText(/password/i), "wrong-password")
    await user.click(screen.getByRole("button", { name: "Login" }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Login request failed.", {
        description: "Authentication with the provided credentials failed.",
      })
    )
    expect(navigate).not.toHaveBeenCalled()
  })
})
