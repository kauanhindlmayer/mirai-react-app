import { http, HttpResponse } from "msw"
import { describe, expect, it, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { RetrospectiveDialog } from "@/components/retrospectives/retrospective-dialog"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"
import type { Retrospective } from "@/types/retrospectives"

function buildRetrospective(
  overrides: Partial<Retrospective> = {}
): Retrospective {
  return {
    id: "retro-1",
    title: "Sprint 1 Retro",
    maxVotesPerUser: 5,
    template: "Classic",
    columns: [],
    ...overrides,
  }
}

describe("RetrospectiveDialog", () => {
  it("shows the create-mode heading with default values", () => {
    renderWithProviders(
      <RetrospectiveDialog open={true} onOpenChange={vi.fn()} teamId="team-1" />
    )

    expect(screen.getByText("Create Retrospective")).toBeInTheDocument()
    expect(screen.getByLabelText("Title")).toHaveValue("")
    expect(screen.getByLabelText("Max Votes Per User")).toHaveValue(5)
    expect(screen.getByRole("combobox")).toHaveTextContent("Classic")
  })

  it("shows a validation error when submitting without a title", async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <RetrospectiveDialog open={true} onOpenChange={vi.fn()} teamId="team-1" />
    )

    await user.click(screen.getByRole("button", { name: "Create" }))

    expect(await screen.findByText("Title is required.")).toBeInTheDocument()
  })

  it("creates a retrospective and reports the new id", async () => {
    let requestBody: unknown
    server.use(
      http.post("*/api/retrospectives", async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json("retro-2")
      })
    )

    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const onCreated = vi.fn()
    renderWithProviders(
      <RetrospectiveDialog
        open={true}
        onOpenChange={onOpenChange}
        teamId="team-1"
        onCreated={onCreated}
      />
    )

    await user.type(screen.getByLabelText("Title"), "Sprint 1 Retro")
    await user.click(screen.getByRole("button", { name: "Create" }))

    await waitFor(() =>
      expect(requestBody).toEqual({
        teamId: "team-1",
        title: "Sprint 1 Retro",
        maxVotesPerUser: 5,
        template: "Classic",
      })
    )
    expect(onCreated).toHaveBeenCalledWith("retro-2")
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("shows the update-mode heading pre-filled from the given retrospective", () => {
    renderWithProviders(
      <RetrospectiveDialog
        open={true}
        onOpenChange={vi.fn()}
        teamId="team-1"
        retrospective={buildRetrospective()}
      />
    )

    expect(screen.getByText("Update Retrospective")).toBeInTheDocument()
    expect(screen.getByLabelText("Title")).toHaveValue("Sprint 1 Retro")
    expect(screen.getByRole("button", { name: "Update" })).toBeInTheDocument()
  })

  it("updates the retrospective with the edited title", async () => {
    let requestBody: unknown
    server.use(
      http.put("*/api/retrospectives/retro-1", async ({ request }) => {
        requestBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      })
    )

    const user = userEvent.setup()
    renderWithProviders(
      <RetrospectiveDialog
        open={true}
        onOpenChange={vi.fn()}
        teamId="team-1"
        retrospective={buildRetrospective()}
      />
    )

    const titleInput = screen.getByLabelText("Title")
    await user.clear(titleInput)
    await user.type(titleInput, "Sprint 2 Retro")
    await user.click(screen.getByRole("button", { name: "Update" }))

    await waitFor(() =>
      expect(requestBody).toMatchObject({ title: "Sprint 2 Retro" })
    )
  })
})
