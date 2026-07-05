import { beforeEach, describe, expect, it, vi } from "vitest"
import { act, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("@/queries/personas", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/queries/personas")>()
  return { ...actual, useCreatePersonaMutation: vi.fn() }
})

import { useCreatePersonaMutation } from "@/queries/personas"
import { CreatePersonaSheet } from "@/components/personas/create-persona-sheet"
import { renderWithProviders } from "@/test/test-utils"

const mutate = vi.fn()

beforeEach(() => {
  mutate.mockClear()
  vi.mocked(useCreatePersonaMutation).mockReturnValue({
    mutate,
    isPending: false,
  } as unknown as ReturnType<typeof useCreatePersonaMutation>)
})

describe("CreatePersonaSheet", () => {
  it("opens the sheet from the New Persona trigger", async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreatePersonaSheet projectId="project-1" />)

    await user.click(screen.getByRole("button", { name: /new persona/i }))

    expect(screen.getByText("Create persona")).toBeInTheDocument()
  })

  it("shows a validation error when submitting without a name", async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreatePersonaSheet projectId="project-1" />)

    await user.click(screen.getByRole("button", { name: /new persona/i }))
    await user.click(screen.getByRole("button", { name: "Create" }))

    expect(await screen.findByText("Name is required.")).toBeInTheDocument()
    expect(mutate).not.toHaveBeenCalled()
  })

  it("submits the name, description, and selected file", async () => {
    URL.createObjectURL = vi.fn(() => "blob:mock-url")

    const user = userEvent.setup()
    renderWithProviders(<CreatePersonaSheet projectId="project-1" />)

    await user.click(screen.getByRole("button", { name: /new persona/i }))
    await user.type(screen.getByLabelText("Name"), "Busy Bea")
    await user.type(screen.getByLabelText("Description"), "Always in a rush")

    const file = new File(["contents"], "avatar.png", { type: "image/png" })
    const fileInput = document.body.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    await user.upload(fileInput, file)

    await user.click(screen.getByRole("button", { name: "Create" }))

    expect(mutate).toHaveBeenCalledWith(
      { name: "Busy Bea", description: "Always in a rush", file },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    )
  })

  it("closes the sheet when the mutation succeeds", async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreatePersonaSheet projectId="project-1" />)

    await user.click(screen.getByRole("button", { name: /new persona/i }))
    await user.type(screen.getByLabelText("Name"), "Busy Bea")
    await user.click(screen.getByRole("button", { name: "Create" }))

    const onSuccess = mutate.mock.calls[0][1].onSuccess
    act(() => {
      onSuccess()
    })

    expect(screen.queryByText("Create persona")).not.toBeInTheDocument()
  })

  it("opens the file picker when the avatar is clicked", async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreatePersonaSheet projectId="project-1" />)

    await user.click(screen.getByRole("button", { name: /new persona/i }))
    const fileInput = document.body.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    const clickSpy = vi.spyOn(fileInput, "click")

    await user.click(screen.getByRole("button", { name: "" }))

    expect(clickSpy).toHaveBeenCalled()
  })
})
