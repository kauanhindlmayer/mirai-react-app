import { http, HttpResponse } from "msw"
import { describe, expect, it, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { DeleteSprintDialog } from "@/components/sprints/delete-sprint-dialog"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"
import { SprintStatus, type Sprint } from "@/types/sprints"

function buildSprint(overrides: Partial<Sprint> = {}): Sprint {
  return {
    id: "sprint-1",
    name: "Sprint 1",
    startDate: "2026-01-01",
    endDate: "2026-01-14",
    status: SprintStatus.Planned,
    startedAtUtc: null,
    workItemCount: 0,
    ...overrides,
  }
}

function renderDialog(sprint: Sprint, onDeleted = vi.fn()) {
  renderWithProviders(
    <DeleteSprintDialog
      teamId="team-1"
      sprint={sprint}
      isOpen
      onOpenChange={vi.fn()}
      onDeleted={onDeleted}
    />
  )
  return { onDeleted }
}

describe("DeleteSprintDialog", () => {
  it("warns that an empty sprint is deleted permanently, without mentioning work items", async () => {
    renderDialog(buildSprint({ workItemCount: 0 }))

    expect(
      await screen.findByText(
        "Sprint 1 will be permanently deleted. This cannot be undone."
      )
    ).toBeInTheDocument()
  })

  it("warns in the singular when the sprint holds one work item", async () => {
    renderDialog(buildSprint({ workItemCount: 1 }))

    expect(
      await screen.findByText(/^1 work item will be returned to the backlog/)
    ).toBeInTheDocument()
  })

  it("warns how many work items return to the backlog", async () => {
    renderDialog(buildSprint({ workItemCount: 12 }))

    expect(
      await screen.findByText(/^12 work items will be returned to the backlog/)
    ).toBeInTheDocument()
  })

  it("deletes the sprint and reports it deleted once confirmed", async () => {
    const deleteRequest = vi.fn()
    server.use(
      http.delete("*/api/teams/team-1/sprints/sprint-1", () => {
        deleteRequest()
        return new HttpResponse(null, { status: 204 })
      })
    )

    const user = userEvent.setup()
    const { onDeleted } = renderDialog(buildSprint({ workItemCount: 3 }))

    await user.click(await screen.findByRole("button", { name: "Delete" }))

    await waitFor(() => expect(deleteRequest).toHaveBeenCalled())
    await waitFor(() => expect(onDeleted).toHaveBeenCalled())
  })

  it("does not delete the sprint when cancelled", async () => {
    const deleteRequest = vi.fn()
    server.use(
      http.delete("*/api/teams/team-1/sprints/sprint-1", () => {
        deleteRequest()
        return new HttpResponse(null, { status: 204 })
      })
    )

    const user = userEvent.setup()
    renderDialog(buildSprint({ workItemCount: 3 }))

    await user.click(await screen.findByRole("button", { name: "Cancel" }))

    expect(deleteRequest).not.toHaveBeenCalled()
  })
})
