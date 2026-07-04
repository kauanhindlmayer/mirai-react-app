import { http, HttpResponse } from "msw"
import { describe, expect, it, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("@/hooks/use-current-project", () => ({
  useCurrentProject: () => ({
    projectId: "project-1",
    project: { id: "project-1", organizationId: "org-1" },
  }),
}))

import { WorkItemAssigneePicker } from "@/components/work-items/work-item-assignee-picker"
import { WorkItemProvider } from "@/components/work-items/work-item-context"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"
import type { AssigneeResponse } from "@/types/work-items"

function renderPicker(assignee?: AssigneeResponse) {
  return renderWithProviders(
    <WorkItemProvider projectId="project-1" workItemId="work-item-1">
      <WorkItemAssigneePicker assignee={assignee} />
    </WorkItemProvider>
  )
}

function mockProjectUsers() {
  server.use(
    http.get("*/api/organizations/org-1/projects/project-1/users", () =>
      HttpResponse.json({
        items: [
          {
            id: "user-2",
            fullName: "Jane Smith",
            email: "jane.smith@mirai.com",
          },
        ],
        totalCount: 1,
        pageSize: 10,
        page: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        totalPages: 1,
      })
    )
  )
}

describe("WorkItemAssigneePicker", () => {
  it('shows "Unassigned" when there is no assignee', () => {
    renderPicker(undefined)

    expect(screen.getByText("Unassigned")).toBeInTheDocument()
  })

  it("shows the assignee's name when assigned", () => {
    renderPicker({
      id: "user-1",
      fullName: "John Doe",
      email: "john.doe@mirai.com",
    })

    expect(screen.getByText("John Doe")).toBeInTheDocument()
  })

  it("assigns a user selected from the search popover", async () => {
    mockProjectUsers()
    let updateRequestBody: unknown
    server.use(
      http.put(
        "*/api/projects/project-1/work-items/work-item-1",
        async ({ request }) => {
          updateRequestBody = await request.json()
          return new HttpResponse(null, { status: 204 })
        }
      )
    )

    const user = userEvent.setup()
    renderPicker(undefined)

    await user.click(screen.getByRole("button", { name: "Unassigned" }))
    await user.click(await screen.findByText("Jane Smith"))

    await waitFor(() =>
      expect(updateRequestBody).toEqual({ assigneeId: "user-2" })
    )
  })

  it("unassigns when Unassign is selected", async () => {
    mockProjectUsers()
    let updateRequestBody: unknown
    server.use(
      http.put(
        "*/api/projects/project-1/work-items/work-item-1",
        async ({ request }) => {
          updateRequestBody = await request.json()
          return new HttpResponse(null, { status: 204 })
        }
      )
    )

    const user = userEvent.setup()
    renderPicker({
      id: "user-1",
      fullName: "John Doe",
      email: "john.doe@mirai.com",
    })

    await user.click(screen.getByRole("button", { name: /John Doe/ }))
    await user.click(await screen.findByText("Unassign"))

    await waitFor(() => expect(updateRequestBody).toEqual({ assigneeId: null }))
  })
})
