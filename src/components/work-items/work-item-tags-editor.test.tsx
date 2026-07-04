import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { WorkItemTagsEditor } from "@/components/work-items/work-item-tags-editor"
import { WorkItemProvider } from "@/components/work-items/work-item-context"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"
import type { TagBriefResponse } from "@/types/work-items"

function renderTagsEditor(tags: TagBriefResponse[]) {
  return renderWithProviders(
    <WorkItemProvider projectId="project-1" workItemId="work-item-1">
      <WorkItemTagsEditor tags={tags} />
    </WorkItemProvider>
  )
}

function mockProjectTags(items: TagBriefResponse[]) {
  server.use(
    http.get("*/api/projects/project-1/tags", () =>
      HttpResponse.json({
        items,
        totalCount: items.length,
        pageSize: 100,
        page: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        totalPages: 1,
      })
    )
  )
}

describe("WorkItemTagsEditor", () => {
  it("renders the work item's existing tags", () => {
    renderTagsEditor([{ id: "tag-1", name: "bug", color: "#ff0000" }])

    expect(screen.getByText("bug")).toBeInTheDocument()
  })

  it("removes a tag when its remove button is clicked", async () => {
    let deleteRequestCount = 0
    server.use(
      http.delete(
        "*/api/projects/project-1/work-items/work-item-1/tags/bug",
        () => {
          deleteRequestCount += 1
          return new HttpResponse(null, { status: 204 })
        }
      )
    )

    const user = userEvent.setup()
    renderTagsEditor([{ id: "tag-1", name: "bug", color: "#ff0000" }])

    await user.click(screen.getByRole("button", { name: "Remove bug" }))

    await waitFor(() => expect(deleteRequestCount).toBe(1))
  })

  it("adds an unadded tag from the search popover", async () => {
    mockProjectTags([{ id: "tag-2", name: "feature", color: "#00ff00" }])
    let addRequestBody: unknown
    server.use(
      http.post(
        "*/api/projects/project-1/work-items/work-item-1/tags",
        async ({ request }) => {
          addRequestBody = await request.json()
          return new HttpResponse(null, { status: 204 })
        }
      )
    )

    const user = userEvent.setup()
    renderTagsEditor([])

    await user.click(screen.getByRole("button", { name: "Tag" }))
    await user.click(await screen.findByText("feature"))

    await waitFor(() => expect(addRequestBody).toEqual({ name: "feature" }))
  })

  it("removes an already-added tag when selected again from the popover", async () => {
    mockProjectTags([{ id: "tag-1", name: "bug", color: "#ff0000" }])
    let deleteRequestCount = 0
    server.use(
      http.delete(
        "*/api/projects/project-1/work-items/work-item-1/tags/bug",
        () => {
          deleteRequestCount += 1
          return new HttpResponse(null, { status: 204 })
        }
      )
    )

    const user = userEvent.setup()
    renderTagsEditor([{ id: "tag-1", name: "bug", color: "#ff0000" }])

    await user.click(screen.getByRole("button", { name: "Tag" }))
    await user.click(await screen.findByText("Added"))

    await waitFor(() => expect(deleteRequestCount).toBe(1))
  })
})
