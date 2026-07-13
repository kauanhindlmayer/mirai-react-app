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

import { WorkItemMainFields } from "@/components/work-items/work-item-detail-dialog"
import { WorkItemProvider } from "@/components/work-items/work-item-context"
import { server } from "@/test/mocks/server"
import { mockMentionableProjectUsers } from "@/test/mocks/project-users"
import { renderWithProviders } from "@/test/test-utils"
import { WorkItemStatus, WorkItemType, type WorkItem } from "@/types/work-items"

function buildWorkItem(overrides: Partial<WorkItem> = {}): WorkItem {
  return {
    id: "work-item-1",
    code: 1,
    title: "Ship the feature",
    description: "Original description",
    acceptanceCriteria: "Original acceptance criteria",
    type: WorkItemType.UserStory,
    status: WorkItemStatus.New,
    childWorkItems: [],
    tags: [],
    comments: [],
    attachments: [],
    outgoingLinks: [],
    incomingLinks: [],
    pullRequestLinks: [],
    createdAtUtc: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

function renderFields(workItem: WorkItem) {
  return renderWithProviders(
    <WorkItemProvider projectId="project-1" workItemId="work-item-1">
      <WorkItemMainFields workItem={workItem} />
    </WorkItemProvider>
  )
}

describe("WorkItemMainFields", () => {
  it("does not persist the description when blurred unchanged", async () => {
    let updateRequestCount = 0
    server.use(
      http.put("*/api/projects/project-1/work-items/work-item-1", () => {
        updateRequestCount += 1
        return new HttpResponse(null, { status: 204 })
      })
    )

    const user = userEvent.setup()
    renderFields(buildWorkItem())

    const description = screen.getByRole("textbox", { name: "Description" })
    await user.click(description)
    await user.tab()

    expect(updateRequestCount).toBe(0)
  })

  it("mentions a project member in the description and persists it on blur", async () => {
    mockMentionableProjectUsers()
    let requestBody: unknown
    server.use(
      http.put(
        "*/api/projects/project-1/work-items/work-item-1",
        async ({ request }) => {
          requestBody = await request.json()
          return new HttpResponse(null, { status: 204 })
        }
      )
    )

    const user = userEvent.setup({ delay: null })
    renderFields(buildWorkItem())

    const description = screen.getByRole("textbox", { name: "Description" })
    await user.click(description)
    await user.type(description, " @jane")

    expect(await screen.findByText("Jane Smith")).toBeInTheDocument()
    await user.keyboard("{Enter}")
    await waitFor(() =>
      expect(
        description.querySelector("[data-mention-user-id='user-2']")
      ).toBeInTheDocument()
    )

    await user.tab()

    await waitFor(() =>
      expect(requestBody).toEqual({
        description: expect.stringContaining('data-id="user-2"'),
      })
    )
  })

  it("mentions a project member in acceptance criteria and persists it on blur", async () => {
    mockMentionableProjectUsers()
    let requestBody: unknown
    server.use(
      http.put(
        "*/api/projects/project-1/work-items/work-item-1",
        async ({ request }) => {
          requestBody = await request.json()
          return new HttpResponse(null, { status: 204 })
        }
      )
    )

    const user = userEvent.setup({ delay: null })
    renderFields(buildWorkItem())

    const acceptanceCriteria = screen.getByRole("textbox", {
      name: "Acceptance criteria",
    })
    await user.click(acceptanceCriteria)
    await user.type(acceptanceCriteria, " @jane")

    expect(await screen.findByText("Jane Smith")).toBeInTheDocument()
    await user.keyboard("{Enter}")
    await waitFor(() =>
      expect(
        acceptanceCriteria.querySelector("[data-mention-user-id='user-2']")
      ).toBeInTheDocument()
    )

    await user.tab()

    await waitFor(() =>
      expect(requestBody).toEqual({
        acceptanceCriteria: expect.stringContaining('data-id="user-2"'),
      })
    )
  })
})
