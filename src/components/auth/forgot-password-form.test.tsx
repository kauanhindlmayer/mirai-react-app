import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

import { toast } from "sonner"

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"

beforeEach(() => {
  vi.mocked(toast.error).mockClear()
})

describe("ForgotPasswordForm", () => {
  it("shows a validation error when submitted empty", async () => {
    const user = userEvent.setup()
    renderWithProviders(<ForgotPasswordForm />)

    await user.click(screen.getByRole("button", { name: /send reset link/i }))

    expect(
      await screen.findByText("Enter a valid email address.")
    ).toBeInTheDocument()
  })

  it("shows a confirmation message instead of navigating on success", async () => {
    const handler = vi.fn()
    server.use(
      http.post("*/api/users/forgot-password", () => {
        handler()
        return new HttpResponse(null, { status: 200 })
      })
    )

    const user = userEvent.setup()
    renderWithProviders(<ForgotPasswordForm />)

    await user.type(screen.getByLabelText(/email/i), "john.doe@mirai.com")
    await user.click(screen.getByRole("button", { name: /send reset link/i }))

    expect(await screen.findByText("Check your email")).toBeInTheDocument()
    expect(handler).toHaveBeenCalledOnce()
  })

  it("shows the same confirmation message even when the email doesn't exist", async () => {
    server.use(
      http.post("*/api/users/forgot-password", () => {
        return new HttpResponse(null, { status: 200 })
      })
    )

    const user = userEvent.setup()
    renderWithProviders(<ForgotPasswordForm />)

    await user.type(screen.getByLabelText(/email/i), "no-such-user@mirai.com")
    await user.click(screen.getByRole("button", { name: /send reset link/i }))

    expect(await screen.findByText("Check your email")).toBeInTheDocument()
  })

  it("shows an error toast when the request fails", async () => {
    server.use(
      http.post("*/api/users/forgot-password", () =>
        HttpResponse.json({ title: "Something went wrong" }, { status: 500 })
      )
    )

    const user = userEvent.setup()
    renderWithProviders(<ForgotPasswordForm />)

    await user.type(screen.getByLabelText(/email/i), "john.doe@mirai.com")
    await user.click(screen.getByRole("button", { name: /send reset link/i }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Forgot password request failed.",
        { description: "Something went wrong" }
      )
    )
  })
})
