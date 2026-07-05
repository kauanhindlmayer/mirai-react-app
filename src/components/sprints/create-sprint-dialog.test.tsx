import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { CreateSprintDialog } from "@/components/sprints/create-sprint-dialog"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"

describe("CreateSprintDialog", () => {
  it("opens the dialog from the New Sprint trigger", async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateSprintDialog teamId="team-1" />)

    await user.click(screen.getByRole("button", { name: /new sprint/i }))

    expect(screen.getByText("Create sprint")).toBeInTheDocument()
  })

  it("shows validation errors when submitted empty", async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateSprintDialog teamId="team-1" />)

    await user.click(screen.getByRole("button", { name: /new sprint/i }))
    await user.click(screen.getByRole("button", { name: "Create" }))

    expect(await screen.findByText("Name is required.")).toBeInTheDocument()
    expect(screen.getByText("Start date is required.")).toBeInTheDocument()
    expect(screen.getByText("End date is required.")).toBeInTheDocument()
  })

  it("shows a validation error when the end date is before the start date", async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateSprintDialog teamId="team-1" />)

    await user.click(screen.getByRole("button", { name: /new sprint/i }))
    await user.type(screen.getByLabelText("Name"), "Sprint 1")
    await user.type(screen.getByLabelText("Start date"), "2026-02-01")
    await user.type(screen.getByLabelText("End date"), "2026-01-01")
    await user.click(screen.getByRole("button", { name: "Create" }))

    expect(
      await screen.findByText("End date must be on or after the start date.")
    ).toBeInTheDocument()
  })

  it("creates a sprint with the entered dates", async () => {
    let requestBody: unknown
    server.use(
      http.post("*/api/teams/team-1/sprints", async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json("sprint-1")
      })
    )

    const user = userEvent.setup()
    renderWithProviders(<CreateSprintDialog teamId="team-1" />)

    await user.click(screen.getByRole("button", { name: /new sprint/i }))
    await user.type(screen.getByLabelText("Name"), "Sprint 1")
    await user.type(screen.getByLabelText("Start date"), "2026-01-01")
    await user.type(screen.getByLabelText("End date"), "2026-01-14")
    await user.click(screen.getByRole("button", { name: "Create" }))

    await waitFor(() =>
      expect(requestBody).toMatchObject({
        name: "Sprint 1",
        startDate: "2026-01-01T00:00:00.000Z",
        endDate: "2026-01-14T00:00:00.000Z",
      })
    )
  })
})
