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
import { renderWithProviders } from "@/test/test-utils"

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

function renderNavUser() {
  return renderWithProviders(
    <SidebarProvider>
      <NavUser user={user} />
    </SidebarProvider>
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
})
