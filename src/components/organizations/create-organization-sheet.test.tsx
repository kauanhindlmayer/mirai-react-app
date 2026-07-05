import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { CreateOrganizationSheet } from "@/components/organizations/create-organization-sheet"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"

describe("CreateOrganizationSheet", () => {
  it("opens the sheet from the New Organization trigger", async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateOrganizationSheet />)

    await user.click(screen.getByRole("button", { name: /new organization/i }))

    expect(screen.getByText("Create organization")).toBeInTheDocument()
  })

  it("shows a validation error when submitting without a name", async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateOrganizationSheet />)

    await user.click(screen.getByRole("button", { name: /new organization/i }))
    await user.click(screen.getByRole("button", { name: "Create" }))

    expect(await screen.findByText("Name is required.")).toBeInTheDocument()
  })

  it("creates an organization and closes the sheet", async () => {
    let requestBody: unknown
    server.use(
      http.post("*/api/organizations", async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json("org-1")
      })
    )

    const user = userEvent.setup()
    renderWithProviders(<CreateOrganizationSheet />)

    await user.click(screen.getByRole("button", { name: /new organization/i }))
    await user.type(screen.getByLabelText("Name"), "Mirai")
    await user.click(screen.getByRole("button", { name: "Create" }))

    await waitFor(() =>
      expect(requestBody).toEqual({ name: "Mirai", description: "" })
    )
    expect(screen.queryByText("Create organization")).not.toBeInTheDocument()
  })
})
