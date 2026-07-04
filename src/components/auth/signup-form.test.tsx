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

import { SignupForm } from "@/components/auth/signup-form"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"

const navigate = vi.fn()

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/first name/i), "John")
  await user.type(screen.getByLabelText(/last name/i), "Doe")
  await user.type(screen.getByLabelText(/^email/i), "john.doe@mirai.com")
  await user.type(screen.getByLabelText(/^password/i), "Password123")
  await user.type(screen.getByLabelText(/confirm password/i), "Password123")
  await user.click(screen.getByRole("checkbox"))
}

beforeEach(() => {
  navigate.mockClear()
  vi.mocked(useNavigate).mockReturnValue(navigate)
  vi.mocked(toast.error).mockClear()
  vi.mocked(toast.success).mockClear()
})

describe("SignupForm", () => {
  it("shows validation errors when submitted empty", async () => {
    const user = userEvent.setup()
    renderWithProviders(<SignupForm />)

    await user.click(screen.getByRole("button", { name: /create account/i }))

    expect(
      await screen.findByText("First name is required.")
    ).toBeInTheDocument()
    expect(screen.getByText("Last name is required.")).toBeInTheDocument()
    expect(
      screen.getByText("Please accept the terms and conditions.")
    ).toBeInTheDocument()
  })

  it("shows a mismatch error when passwords don't match", async () => {
    const user = userEvent.setup()
    renderWithProviders(<SignupForm />)

    await fillValidForm(user)
    await user.clear(screen.getByLabelText(/confirm password/i))
    await user.type(screen.getByLabelText(/confirm password/i), "Different1")
    await user.click(screen.getByRole("button", { name: /create account/i }))

    expect(
      await screen.findByText("Passwords do not match.")
    ).toBeInTheDocument()
  })

  it("registers and navigates to /login on success", async () => {
    server.use(
      http.post("*/api/users/register", () => HttpResponse.json("user-1"))
    )

    const user = userEvent.setup()
    renderWithProviders(<SignupForm />)

    await fillValidForm(user)
    await user.click(screen.getByRole("button", { name: /create account/i }))

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/login"))
    expect(toast.success).toHaveBeenCalledWith(
      "Account created successfully. Please log in."
    )
  })

  it("shows an error toast when registration fails", async () => {
    server.use(
      http.post("*/api/users/register", () =>
        HttpResponse.json(
          { title: "Bad Request", detail: "Email already in use" },
          { status: 400 }
        )
      )
    )

    const user = userEvent.setup()
    renderWithProviders(<SignupForm />)

    await fillValidForm(user)
    await user.click(screen.getByRole("button", { name: /create account/i }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Sign up failed.", {
        description: "Email already in use",
      })
    )
    expect(navigate).not.toHaveBeenCalled()
  })
})
