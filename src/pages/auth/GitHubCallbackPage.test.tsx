import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { waitFor } from "@testing-library/react"

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>()
  return { ...actual, useNavigate: vi.fn() }
})
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

import { useNavigate } from "react-router"
import { toast } from "sonner"

import GitHubCallbackPage from "@/pages/auth/GitHubCallbackPage"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"

const navigate = vi.fn()

beforeEach(() => {
  localStorage.clear()
  navigate.mockClear()
  vi.mocked(useNavigate).mockReturnValue(navigate)
  vi.mocked(toast.error).mockClear()
})

describe("GitHubCallbackPage", () => {
  it("exchanges the code and navigates home on success", async () => {
    let exchangeRequestBody: unknown
    server.use(
      http.post("*/api/users/login/github", async ({ request }) => {
        exchangeRequestBody = await request.json()
        return HttpResponse.json({ accessToken: "token-abc" })
      }),
      http.get("*/api/users/me", () =>
        HttpResponse.json({
          id: "1",
          email: "john.doe@mirai.com",
          firstName: "John",
          lastName: "Doe",
        })
      )
    )

    renderWithProviders(<GitHubCallbackPage />, {
      route: "/auth/github/callback?code=abc123",
    })

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/"))
    expect(exchangeRequestBody).toMatchObject({ code: "abc123" })
  })

  it("shows an error toast and redirects to login when the provider reports an error", async () => {
    renderWithProviders(<GitHubCallbackPage />, {
      route: "/auth/github/callback?error=access_denied",
    })

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "GitHub sign-in failed.",
        expect.objectContaining({ description: "access_denied" })
      )
    )
    expect(navigate).toHaveBeenCalledWith("/login")
  })

  it("shows an error toast and redirects to login when no code is present", async () => {
    renderWithProviders(<GitHubCallbackPage />, {
      route: "/auth/github/callback",
    })

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "GitHub sign-in failed.",
        expect.objectContaining({ description: "Missing authorization code." })
      )
    )
    expect(navigate).toHaveBeenCalledWith("/login")
  })

  it("shows an error toast and redirects to login when the exchange fails", async () => {
    server.use(
      http.post("*/api/users/login/github", () =>
        HttpResponse.json(
          { title: "Invalid authorization code." },
          { status: 400 }
        )
      )
    )

    renderWithProviders(<GitHubCallbackPage />, {
      route: "/auth/github/callback?code=abc123",
    })

    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(navigate).toHaveBeenCalledWith("/login")
  })
})
