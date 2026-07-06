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
import { ThemeProvider } from "@/components/layout/theme-provider"
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
  document.documentElement.classList.remove("light", "dark")
  navigate.mockClear()
  vi.mocked(useNavigate).mockReturnValue(navigate)
})

function renderNavUser(queryClient = createTestQueryClient()) {
  return renderWithProviders(
    <ThemeProvider storageKey="nav-user-test">
      <SidebarProvider>
        <NavUser user={user} />
      </SidebarProvider>
    </ThemeProvider>,
    { queryClient }
  )
}

describe("NavUser", () => {
  it("renders the user's name and email", () => {
    renderNavUser()

    expect(screen.getByText("John Doe")).toBeInTheDocument()
    expect(screen.getByText("john@mirai.com")).toBeInTheDocument()
  })

  it("shows Settings and Log out actions in the dropdown", async () => {
    const clickUser = userEvent.setup()
    renderNavUser()

    await clickUser.click(screen.getByText("John Doe"))

    expect(
      screen.getByRole("menuitem", { name: /settings/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("menuitem", { name: /log out/i })
    ).toBeInTheDocument()
  })

  it("shows Light, Dark, and System options under the Appearance submenu", async () => {
    const clickUser = userEvent.setup()
    renderNavUser()

    await clickUser.click(screen.getByText("John Doe"))
    await clickUser.click(screen.getByRole("menuitem", { name: /appearance/i }))

    expect(
      await screen.findByRole("menuitemcheckbox", { name: /light/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("menuitemcheckbox", { name: /dark/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("menuitemcheckbox", { name: /system/i })
    ).toBeInTheDocument()
  })

  it("shows disabled language options under the Language submenu", async () => {
    const clickUser = userEvent.setup()
    renderNavUser()

    await clickUser.click(screen.getByText("John Doe"))
    await clickUser.click(screen.getByRole("menuitem", { name: /language/i }))

    const englishOption = await screen.findByRole("menuitemcheckbox", {
      name: /english/i,
    })
    expect(englishOption).toHaveAttribute("data-disabled")
    expect(englishOption).toHaveAttribute("data-state", "checked")
    expect(
      screen.getByRole("menuitemcheckbox", { name: /português/i })
    ).toHaveAttribute("data-disabled")
  })

  it("shows disabled stub links and a working shortcuts action under Learn more", async () => {
    const clickUser = userEvent.setup()
    renderNavUser()

    await clickUser.click(screen.getByText("John Doe"))
    await clickUser.click(screen.getByRole("menuitem", { name: /learn more/i }))

    expect(
      await screen.findByRole("menuitem", { name: /documentation/i })
    ).toHaveAttribute("data-disabled")
    expect(
      screen.getByRole("menuitem", { name: /release notes/i })
    ).toHaveAttribute("data-disabled")
    expect(
      screen.getByRole("menuitem", { name: /keyboard shortcuts/i })
    ).not.toHaveAttribute("data-disabled")
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

  it("opens the settings dialog when Settings is clicked", async () => {
    signIn()
    const clickUser = userEvent.setup()
    renderNavUser()

    await clickUser.click(screen.getByText("John Doe"))
    await clickUser.click(screen.getByRole("menuitem", { name: /settings/i }))

    expect(await screen.findByLabelText("First Name")).toBeInTheDocument()
  })

  it("opens the settings dialog on Ctrl+,", async () => {
    signIn()
    const user = userEvent.setup()
    renderNavUser()

    await user.keyboard("{Control>},{/Control}")

    expect(await screen.findByLabelText("First Name")).toBeInTheDocument()
  })

  it("opens the keyboard shortcuts dialog on ?", async () => {
    const user = userEvent.setup()
    renderNavUser()

    await user.keyboard("?")

    expect(await screen.findByText("Open global search")).toBeInTheDocument()
  })
})
