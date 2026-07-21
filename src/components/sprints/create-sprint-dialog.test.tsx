import { format, parseISO } from "date-fns"
import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { CreateSprintDialog } from "@/components/sprints/create-sprint-dialog"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"
import { SprintStatus, type Sprint } from "@/types/sprints"

function buildSprint(overrides: Partial<Sprint> = {}): Sprint {
  return {
    id: "sprint-1",
    name: "Sprint 1",
    startDate: "2026-01-05",
    endDate: "2026-01-16",
    status: SprintStatus.Planned,
    startedAtUtc: null,
    workItemCount: 0,
    ...overrides,
  }
}

// Not anchored: react-day-picker prefixes today's label ("Today, Thursday, …")
// and suffixes a selected day (", selected"). The date itself is unique enough.
function dayLabel(date: string) {
  return new RegExp(format(parseISO(date), "EEEE, MMMM do, yyyy"))
}

function renderDialog(sprints: Sprint[] = []) {
  return renderWithProviders(
    <CreateSprintDialog teamId="team-1" sprints={sprints} />
  )
}

// The pickers open on the current month, so a blocked sprint has to live there
// too. Days 2-21 exist in every month, so this is clock-dependent but not fragile.
const thisMonth = format(new Date(), "yyyy-MM")

describe("CreateSprintDialog", () => {
  it("opens the dialog from the New Sprint trigger", async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole("button", { name: /new sprint/i }))

    expect(screen.getByText("Create sprint")).toBeInTheDocument()
  })

  it("shows validation errors when submitted empty", async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole("button", { name: /new sprint/i }))
    await user.click(screen.getByRole("button", { name: "Create" }))

    expect(await screen.findByText("Name is required.")).toBeInTheDocument()
    expect(screen.getByText("Start date is required.")).toBeInTheDocument()
  })

  it("cannot pick an end date before a start date is chosen", async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole("button", { name: /new sprint/i }))

    expect(await screen.findByLabelText("End date")).toBeDisabled()
    expect(screen.getByLabelText("End date")).toHaveTextContent(
      "Pick a start date first"
    )
  })

  it("sends the picked dates as plain calendar dates", async () => {
    let requestBody: unknown
    server.use(
      http.post("*/api/teams/team-1/sprints", async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json("sprint-1")
      })
    )

    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole("button", { name: /new sprint/i }))
    await user.type(screen.getByLabelText("Name"), "Sprint 1")

    await user.click(screen.getByLabelText("Start date"))
    await user.click(
      await screen.findByRole("button", { name: dayLabel(`${thisMonth}-02`) })
    )

    await user.click(screen.getByLabelText("End date"))
    await user.click(
      await screen.findByRole("button", { name: dayLabel(`${thisMonth}-15`) })
    )

    await user.click(screen.getByRole("button", { name: "Create" }))

    await waitFor(() =>
      expect(requestBody).toEqual({
        name: "Sprint 1",
        startDate: `${thisMonth}-02`,
        endDate: `${thisMonth}-15`,
      })
    )
  })

  it("shows the chosen start date on its trigger", async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole("button", { name: /new sprint/i }))
    await user.click(screen.getByLabelText("Start date"))
    await user.click(
      await screen.findByRole("button", { name: dayLabel(`${thisMonth}-02`) })
    )

    expect(screen.getByLabelText("Start date")).toHaveTextContent(
      format(parseISO(`${thisMonth}-02`), "d MMM yyyy")
    )
  })

  it("disables the days already covered by another sprint", async () => {
    const user = userEvent.setup()
    renderDialog([
      buildSprint({
        startDate: `${thisMonth}-05`,
        endDate: `${thisMonth}-16`,
      }),
    ])

    await user.click(screen.getByRole("button", { name: /new sprint/i }))
    await user.click(screen.getByLabelText("Start date"))

    expect(
      await screen.findByRole("button", { name: dayLabel(`${thisMonth}-05`) })
    ).toBeDisabled()
    expect(
      screen.getByRole("button", { name: dayLabel(`${thisMonth}-16`) })
    ).toBeDisabled()
    expect(
      screen.getByRole("button", { name: dayLabel(`${thisMonth}-17`) })
    ).not.toBeDisabled()
  })

  it("stops the end date from reaching past a later sprint", async () => {
    const user = userEvent.setup()
    renderDialog([
      buildSprint({
        startDate: `${thisMonth}-10`,
        endDate: `${thisMonth}-20`,
      }),
    ])

    await user.click(screen.getByRole("button", { name: /new sprint/i }))
    await user.click(screen.getByLabelText("Start date"))
    await user.click(
      await screen.findByRole("button", { name: dayLabel(`${thisMonth}-02`) })
    )

    await user.click(screen.getByLabelText("End date"))

    expect(
      await screen.findByRole("button", { name: dayLabel(`${thisMonth}-09`) })
    ).not.toBeDisabled()
    expect(
      screen.getByRole("button", { name: dayLabel(`${thisMonth}-21`) })
    ).toBeDisabled()
  })
})
