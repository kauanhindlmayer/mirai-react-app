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

import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"

const navigate = vi.fn()
const resetPasswordRoute =
  "/reset-password?token=reset-token&email=john.doe%40mirai.com"

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/new password/i), "Password123")
  await user.type(screen.getByLabelText(/confirm password/i), "Password123")
}

beforeEach(() => {
  navigate.mockClear()
  vi.mocked(useNavigate).mockReturnValue(navigate)
  vi.mocked(toast.error).mockClear()
  vi.mocked(toast.success).mockClear()
})

describe("ResetPasswordForm", () => {
  it("shows validation errors when submitted empty", async () => {
    const user = userEvent.setup()
    renderWithProviders(<ResetPasswordForm />, { route: resetPasswordRoute })

    await user.click(screen.getByRole("button", { name: /reset password/i }))

    expect(
      await screen.findByText("Must be at least 8 characters long.")
    ).toBeInTheDocument()
  })

  it("shows a mismatch error when passwords don't match", async () => {
    const user = userEvent.setup()
    renderWithProviders(<ResetPasswordForm />, { route: resetPasswordRoute })

    await user.type(screen.getByLabelText(/new password/i), "Password123")
    await user.type(screen.getByLabelText(/confirm password/i), "Different1")
    await user.click(screen.getByRole("button", { name: /reset password/i }))

    expect(
      await screen.findByText("Passwords do not match.")
    ).toBeInTheDocument()
  })

  it("resets the password and navigates to /login on success", async () => {
    const handler = vi.fn()
    server.use(
      http.post("*/api/users/reset-password", async ({ request }) => {
        handler(await request.json())
        return new HttpResponse(null, { status: 200 })
      })
    )

    const user = userEvent.setup()
    renderWithProviders(<ResetPasswordForm />, { route: resetPasswordRoute })

    await fillValidForm(user)
    await user.click(screen.getByRole("button", { name: /reset password/i }))

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/login"))
    expect(toast.success).toHaveBeenCalledWith(
      "Password reset successfully. Please log in."
    )
    expect(handler).toHaveBeenCalledWith({
      email: "john.doe@mirai.com",
      token: "reset-token",
      newPassword: "Password123",
    })
  })

  it("shows an error toast when the token is invalid or expired", async () => {
    server.use(
      http.post("*/api/users/reset-password", () =>
        HttpResponse.json(
          { title: "The password reset token is invalid or has expired." },
          { status: 400 }
        )
      )
    )

    const user = userEvent.setup()
    renderWithProviders(<ResetPasswordForm />, { route: resetPasswordRoute })

    await fillValidForm(user)
    await user.click(screen.getByRole("button", { name: /reset password/i }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Password reset failed.", {
        description: "The password reset token is invalid or has expired.",
      })
    )
    expect(navigate).not.toHaveBeenCalled()
  })
})
