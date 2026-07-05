import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { CreateTagPopover } from "@/components/tags/create-tag-popover"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"

describe("CreateTagPopover", () => {
  it("opens the popover from the New Tag trigger", async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateTagPopover projectId="project-1" />)

    await user.click(screen.getByRole("button", { name: /new tag/i }))

    expect(screen.getByPlaceholderText("Tag name")).toBeInTheDocument()
  })

  it("shows a validation error when submitting without a name", async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateTagPopover projectId="project-1" />)

    await user.click(screen.getByRole("button", { name: /new tag/i }))
    await user.click(screen.getByRole("button", { name: "Create" }))

    expect(await screen.findByText("Name is required.")).toBeInTheDocument()
  })

  it("creates a tag with the selected color and closes the popover", async () => {
    let requestBody: unknown
    server.use(
      http.post("*/api/projects/project-1/tags", async ({ request }) => {
        requestBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      })
    )

    const user = userEvent.setup()
    renderWithProviders(<CreateTagPopover projectId="project-1" />)

    await user.click(screen.getByRole("button", { name: /new tag/i }))
    await user.type(screen.getByPlaceholderText("Tag name"), "bug")
    await user.click(screen.getByRole("button", { name: "Create" }))

    await waitFor(() =>
      expect(requestBody).toEqual({
        name: "bug",
        description: "",
        color: "#2a78d6",
      })
    )
    expect(screen.queryByPlaceholderText("Tag name")).not.toBeInTheDocument()
  })
})
