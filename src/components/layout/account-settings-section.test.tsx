import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("@/api/users", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/users")>()
  return { ...actual, updateAvatar: vi.fn() }
})
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

import { updateAvatar } from "@/api/users"
import { AccountSettingsSection } from "@/components/layout/account-settings-section"
import { setAccessToken } from "@/lib/auth-storage"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"
import { toast } from "sonner"

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
  vi.mocked(toast.error).mockClear()
})

describe("AccountSettingsSection", () => {
  it("shows the form pre-filled with the current user's name", async () => {
    signIn()
    renderWithProviders(<AccountSettingsSection />)

    expect(await screen.findByLabelText("First Name")).toHaveValue("John")
    expect(screen.getByLabelText("Last Name")).toHaveValue("Doe")
  })

  it("disables Save until a change is made", async () => {
    signIn()
    renderWithProviders(<AccountSettingsSection />)

    await screen.findByLabelText("First Name")

    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled()
  })

  it("saves the updated name", async () => {
    signIn()
    let requestBody: unknown
    server.use(
      http.put("*/api/users/profile", async ({ request }) => {
        requestBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      })
    )

    const user = userEvent.setup()
    renderWithProviders(<AccountSettingsSection />)

    const lastNameInput = await screen.findByLabelText("Last Name")
    await user.clear(lastNameInput)
    await user.type(lastNameInput, "Smith")
    await user.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() =>
      expect(requestBody).toEqual({ firstName: "John", lastName: "Smith" })
    )
  })

  it("enables Save when the first name is edited", async () => {
    signIn()
    const user = userEvent.setup()
    renderWithProviders(<AccountSettingsSection />)

    const firstNameInput = await screen.findByLabelText("First Name")
    await user.clear(firstNameInput)
    await user.type(firstNameInput, "Jonathan")

    expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled()
  })

  it("opens the file picker when the avatar is clicked", async () => {
    signIn()
    const user = userEvent.setup()
    renderWithProviders(<AccountSettingsSection />)

    await screen.findByLabelText("First Name")
    const fileInput = document.body.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    const clickSpy = vi.spyOn(fileInput, "click")

    await user.click(screen.getByRole("button", { name: "JD" }))

    expect(clickSpy).toHaveBeenCalled()
  })

  it("shows an error toast when saving the profile fails", async () => {
    signIn()
    server.use(http.put("*/api/users/profile", () => HttpResponse.error()))

    const user = userEvent.setup()
    renderWithProviders(<AccountSettingsSection />)

    const lastNameInput = await screen.findByLabelText("Last Name")
    await user.clear(lastNameInput)
    await user.type(lastNameInput, "Smith")
    await user.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to update profile.",
        expect.anything()
      )
    )
  })

  it("shows an error toast when uploading the avatar fails", async () => {
    signIn()
    URL.createObjectURL = vi.fn(() => "blob:mock-url")
    vi.mocked(updateAvatar).mockRejectedValueOnce(new Error("Upload failed"))

    const user = userEvent.setup()
    renderWithProviders(<AccountSettingsSection />)

    await screen.findByLabelText("First Name")
    const file = new File(["contents"], "avatar.png", { type: "image/png" })
    const fileInput = document.body.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    await user.upload(fileInput, file)
    await user.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to update avatar.",
        expect.anything()
      )
    )
  })

  it("uploads the selected avatar file when saving", async () => {
    signIn()
    URL.createObjectURL = vi.fn(() => "blob:mock-url")

    const user = userEvent.setup()
    renderWithProviders(<AccountSettingsSection />)

    await screen.findByLabelText("First Name")
    const file = new File(["contents"], "avatar.png", { type: "image/png" })
    const fileInput = document.body.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    await user.upload(fileInput, file)

    await user.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() => expect(updateAvatar).toHaveBeenCalled())
    expect(vi.mocked(updateAvatar).mock.calls[0][0]).toBe(file)
  })

  it("calls onSaved after a successful save", async () => {
    signIn()
    server.use(
      http.put(
        "*/api/users/profile",
        () => new HttpResponse(null, { status: 204 })
      )
    )
    const onSaved = vi.fn()

    const user = userEvent.setup()
    renderWithProviders(<AccountSettingsSection onSaved={onSaved} />)

    const lastNameInput = await screen.findByLabelText("Last Name")
    await user.clear(lastNameInput)
    await user.type(lastNameInput, "Smith")
    await user.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() => expect(onSaved).toHaveBeenCalled())
  })
})
