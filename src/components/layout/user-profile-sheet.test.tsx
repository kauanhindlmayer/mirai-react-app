import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("@/api/users", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/users")>()
  return { ...actual, updateAvatar: vi.fn() }
})

import { updateAvatar } from "@/api/users"
import { UserProfileSheet } from "@/components/layout/user-profile-sheet"
import { setAccessToken } from "@/lib/auth-storage"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"

function buildToken(payload: Record<string, unknown>): string {
  return `header.${btoa(JSON.stringify(payload))}.signature`
}

function signIn() {
  setAccessToken(buildToken({ exp: Math.floor(Date.now() / 1000) + 3600 }))
  server.use(
    http.get("*/api/users/me", () =>
      HttpResponse.json({
        id: "user-1",
        email: "john.doe@mirai.com",
        firstName: "John",
        lastName: "Doe",
        fullName: "John Doe",
        imageUrl: "",
      })
    )
  )
}

beforeEach(() => {
  localStorage.clear()
  vi.mocked(updateAvatar).mockClear()
  vi.mocked(updateAvatar).mockResolvedValue(undefined)
})

describe("UserProfileSheet", () => {
  it("renders nothing when closed", () => {
    signIn()
    renderWithProviders(
      <UserProfileSheet open={false} onOpenChange={vi.fn()} />
    )

    expect(screen.queryByText("Edit profile")).not.toBeInTheDocument()
  })

  it("shows the form pre-filled with the current user's name when open", async () => {
    signIn()
    renderWithProviders(<UserProfileSheet open={true} onOpenChange={vi.fn()} />)

    expect(await screen.findByText("Edit profile")).toBeInTheDocument()
    expect(screen.getByLabelText("First Name")).toHaveValue("John")
    expect(screen.getByLabelText("Last Name")).toHaveValue("Doe")
  })

  it("disables Save until a change is made", async () => {
    signIn()
    renderWithProviders(<UserProfileSheet open={true} onOpenChange={vi.fn()} />)

    await screen.findByText("Edit profile")

    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled()
  })

  it("saves the updated name and closes the sheet", async () => {
    signIn()
    let requestBody: unknown
    server.use(
      http.put("*/api/users/profile", async ({ request }) => {
        requestBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      })
    )

    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    renderWithProviders(
      <UserProfileSheet open={true} onOpenChange={onOpenChange} />
    )

    await screen.findByText("Edit profile")
    const lastNameInput = screen.getByLabelText("Last Name")
    await user.clear(lastNameInput)
    await user.type(lastNameInput, "Smith")
    await user.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() =>
      expect(requestBody).toEqual({ firstName: "John", lastName: "Smith" })
    )
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("uploads the selected avatar file when saving", async () => {
    signIn()
    URL.createObjectURL = vi.fn(() => "blob:mock-url")

    const user = userEvent.setup()
    renderWithProviders(<UserProfileSheet open={true} onOpenChange={vi.fn()} />)

    await screen.findByText("Edit profile")
    const file = new File(["contents"], "avatar.png", { type: "image/png" })
    const fileInput = document.body.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    await user.upload(fileInput, file)

    await user.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() => expect(updateAvatar).toHaveBeenCalled())
    expect(vi.mocked(updateAvatar).mock.calls[0][0]).toBe(file)
  })
})
