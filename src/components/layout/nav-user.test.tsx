import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>()
  return { ...actual, useNavigate: vi.fn() }
})

import { useNavigate } from "react-router"
import { NavUser } from "@/components/layout/nav-user"
import { SidebarProvider } from "@/components/ui/sidebar"
import { setAccessToken } from "@/lib/auth-storage"
import { server } from "@/test/mocks/server"
import { createTestQueryClient, renderWithProviders } from "@/test/test-utils"

function buildToken(payload: Record<string, unknown>): string {
  return `header.${btoa(JSON.stringify(payload))}.signature`
}

function signIn() {
  setAccessToken(buildToken({ exp: Math.floor(Date.now() / 1000) + 3600 }))
  server.use(
    http.get("*/api/users/me", () =>
      HttpResponse.json({
        id: "user-1",
        email: "john@mirai.com",
        firstName: "John",
        lastName: "Doe",
        fullName: "John Doe",
        imageUrl: "",
      })
    )
  )
}

const navigate = vi.fn()
const user = {
  name: "John Doe",
  email: "john@mirai.com",
  avatar: "",
}

beforeEach(() => {
  localStorage.clear()
  navigate.mockClear()
  vi.mocked(useNavigate).mockReturnValue(navigate)
})

function renderNavUser(queryClient = createTestQueryClient()) {
  return renderWithProviders(
    <SidebarProvider>
      <NavUser user={user} />
    </SidebarProvider>,
    { queryClient }
  )
}

describe("NavUser", () => {
  it("renders the user's name and email", () => {
    renderNavUser()

    expect(screen.getByText("John Doe")).toBeInTheDocument()
    expect(screen.getByText("john@mirai.com")).toBeInTheDocument()
  })

  it("shows Account and Log out actions in the dropdown", async () => {
    const clickUser = userEvent.setup()
    renderNavUser()

    await clickUser.click(screen.getByText("John Doe"))

    expect(
      screen.getByRole("menuitem", { name: /account/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("menuitem", { name: /log out/i })
    ).toBeInTheDocument()
  })

  it("clears auth storage and navigates to login when Log out is clicked", async () => {
    setAccessToken("token-abc")
    const clickUser = userEvent.setup()
    renderNavUser()

    await clickUser.click(screen.getByText("John Doe"))
    await clickUser.click(screen.getByRole("menuitem", { name: /log out/i }))

    expect(localStorage.getItem("accessToken")).toBeNull()
    expect(navigate).toHaveBeenCalledWith("/login")
  })

  it("clears the query cache when Log out is clicked", async () => {
    setAccessToken("token-abc")
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(["current-user"], { id: "user-1" })
    const clickUser = userEvent.setup()
    renderNavUser(queryClient)

    await clickUser.click(screen.getByText("John Doe"))
    await clickUser.click(screen.getByRole("menuitem", { name: /log out/i }))

    expect(queryClient.getQueryData(["current-user"])).toBeUndefined()
  })

  it("opens the profile sheet when Account is clicked", async () => {
    signIn()
    const clickUser = userEvent.setup()
    renderNavUser()

    await clickUser.click(screen.getByText("John Doe"))
    await clickUser.click(screen.getByRole("menuitem", { name: /account/i }))

    expect(await screen.findByText("Edit profile")).toBeInTheDocument()
  })
})
