import { format, parseISO } from "date-fns"
import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

import { toast } from "sonner"

import { EditSprintDialog } from "@/components/sprints/edit-sprint-dialog"
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

function renderDialog(sprint: Sprint = buildSprint(), sprints?: Sprint[]) {
  return renderWithProviders(
    <EditSprintDialog
      teamId="team-1"
      sprint={sprint}
      sprints={sprints ?? [sprint]}
      isOpen
      onOpenChange={vi.fn()}
    />
  )
}

beforeEach(() => {
  vi.mocked(toast.error).mockClear()
})

describe("EditSprintDialog", () => {
  it("prefills the form with the sprint's current name and dates", async () => {
    renderDialog()

    expect(await screen.findByLabelText("Name")).toHaveValue("Sprint 1")
    expect(screen.getByLabelText("Start date")).toHaveTextContent("5 Jan 2026")
    expect(screen.getByLabelText("End date")).toHaveTextContent("16 Jan 2026")
  })

  it("sends the newly picked dates as plain calendar dates", async () => {
    let requestBody: unknown
    server.use(
      http.put("*/api/teams/team-1/sprints/sprint-1", async ({ request }) => {
        requestBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      })
    )

    const user = userEvent.setup()
    renderDialog()

    await user.click(await screen.findByLabelText("Start date"))
    await user.click(
      await screen.findByRole("button", { name: dayLabel("2026-01-19") })
    )

    await user.click(screen.getByLabelText("End date"))
    await user.click(
      await screen.findByRole("button", { name: dayLabel("2026-01-30") })
    )

    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() =>
      expect(requestBody).toEqual({
        name: "Sprint 1",
        startDate: "2026-01-19",
        endDate: "2026-01-30",
      })
    )
  })

  it("leaves the sprint's own dates selectable, but disables another sprint's", async () => {
    const sprint = buildSprint()
    renderDialog(sprint, [
      sprint,
      buildSprint({
        id: "sprint-2",
        name: "Sprint 2",
        startDate: "2026-01-19",
        endDate: "2026-01-30",
      }),
    ])

    const user = userEvent.setup()
    await user.click(await screen.findByLabelText("Start date"))

    expect(
      await screen.findByRole("button", { name: dayLabel("2026-01-05") })
    ).not.toBeDisabled()
    expect(
      screen.getByRole("button", { name: dayLabel("2026-01-19") })
    ).toBeDisabled()
    expect(
      screen.getByRole("button", { name: dayLabel("2026-01-30") })
    ).toBeDisabled()
  })

  it("clears the end date when the new start date is after it", async () => {
    const user = userEvent.setup()
    renderDialog()

    expect(await screen.findByLabelText("End date")).toHaveTextContent(
      "16 Jan 2026"
    )

    await user.click(screen.getByLabelText("Start date"))
    await user.click(
      await screen.findByRole("button", { name: dayLabel("2026-01-26") })
    )

    expect(screen.getByLabelText("End date")).toHaveTextContent(
      "Pick an end date"
    )
  })

  it("names the sprint it clashes with when the backend rejects the save", async () => {
    server.use(
      http.put("*/api/teams/team-1/sprints/sprint-1", () =>
        HttpResponse.json(
          {
            title: "Validation error",
            detail: "These dates overlap the sprint 'Hardening'.",
            status: 400,
          },
          { status: 400 }
        )
      )
    )

    const user = userEvent.setup()
    renderDialog()

    await user.click(await screen.findByRole("button", { name: "Save" }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Failed to update sprint.", {
        description: "These dates overlap the sprint 'Hardening'.",
      })
    )
  })

  it("names the sprint that already has the name, and stays open", async () => {
    server.use(
      http.put("*/api/teams/team-1/sprints/sprint-1", () =>
        HttpResponse.json(
          {
            title: "Validation error",
            detail: "A sprint named 'Hardening' already exists in this team.",
            status: 400,
          },
          { status: 400 }
        )
      )
    )

    const user = userEvent.setup()
    renderDialog()

    await user.clear(await screen.findByLabelText("Name"))
    await user.type(screen.getByLabelText("Name"), "Hardening")
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Failed to update sprint.", {
        description: "A sprint named 'Hardening' already exists in this team.",
      })
    )
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument()
  })

  it("rejects a name shorter than the API's minimum before sending it", async () => {
    const putRequest = vi.fn()
    server.use(
      http.put("*/api/teams/team-1/sprints/sprint-1", () => {
        putRequest()
        return new HttpResponse(null, { status: 204 })
      })
    )

    const user = userEvent.setup()
    renderDialog()

    await user.clear(await screen.findByLabelText("Name"))
    await user.type(screen.getByLabelText("Name"), "S1")
    await user.click(screen.getByRole("button", { name: "Save" }))

    expect(
      await screen.findByText("Name must be at least 3 characters.")
    ).toBeInTheDocument()
    expect(putRequest).not.toHaveBeenCalled()
  })
})
