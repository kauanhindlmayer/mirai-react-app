import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { WorkItemLinks } from "@/components/work-items/work-item-links"
import { WorkItemProvider } from "@/components/work-items/work-item-context"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"
import type { WorkItemLink } from "@/types/work-items"

function renderLinks(
  outgoingLinks: WorkItemLink[],
  incomingLinks: WorkItemLink[] = []
) {
  return renderWithProviders(
    <WorkItemProvider projectId="project-1" workItemId="work-item-1">
      <WorkItemLinks
        outgoingLinks={outgoingLinks}
        incomingLinks={incomingLinks}
      />
    </WorkItemProvider>
  )
}

function buildLink(overrides: Partial<WorkItemLink> = {}): WorkItemLink {
  return {
    id: "link-1",
    targetWorkItem: {
      id: "work-item-2",
      code: 42,
      title: "Fix the bug",
      type: "Bug",
      status: "New",
    },
    linkType: "Related",
    ...overrides,
  }
}

describe("WorkItemLinks", () => {
  it("renders a placeholder when there are no links", () => {
    renderLinks([])

    expect(screen.getByText("No linked work items.")).toBeInTheDocument()
  })

  it("renders outgoing links with their type and a remove button", () => {
    renderLinks([buildLink()])

    expect(screen.getByText("Related")).toBeInTheDocument()
    expect(screen.getByText("#42 Fix the bug")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Remove link" })
    ).toBeInTheDocument()
  })

  it("renders incoming links without a remove button", () => {
    renderLinks([], [buildLink({ id: "link-2", linkType: "Predecessor" })])

    expect(screen.getByText("Predecessor (from)")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Remove link" })
    ).not.toBeInTheDocument()
  })

  it("removes an outgoing link when its remove button is clicked", async () => {
    let deleteRequestCount = 0
    server.use(
      http.delete(
        "*/api/projects/project-1/work-items/work-item-1/links/link-1",
        () => {
          deleteRequestCount += 1
          return new HttpResponse(null, { status: 204 })
        }
      )
    )

    const user = userEvent.setup()
    renderLinks([buildLink()])

    await user.click(screen.getByRole("button", { name: "Remove link" }))

    await waitFor(() => expect(deleteRequestCount).toBe(1))
  })

  it("links a work item found via search", async () => {
    server.use(
      http.get("*/api/projects/project-1/work-items", ({ request }) => {
        const url = new URL(request.url)
        expect(url.searchParams.get("q")).toBe("bug")
        return HttpResponse.json({
          items: [
            {
              id: "work-item-3",
              code: 7,
              title: "Crash on startup",
              type: "Bug",
              status: "New",
              tags: [],
            },
          ],
          totalCount: 1,
          pageSize: 10,
          page: 1,
          hasNextPage: false,
          hasPreviousPage: false,
          totalPages: 1,
        })
      })
    )
    let createRequestBody: unknown
    server.use(
      http.post(
        "*/api/projects/project-1/work-items/work-item-1/links",
        async ({ request }) => {
          createRequestBody = await request.json()
          return HttpResponse.json("link-3")
        }
      )
    )

    const user = userEvent.setup()
    renderLinks([])

    await user.click(screen.getByRole("button", { name: "Link work item" }))
    await user.type(screen.getByPlaceholderText("Search work items..."), "bug")
    await user.click(await screen.findByText("#7 Crash on startup"))

    await waitFor(() =>
      expect(createRequestBody).toEqual({
        targetWorkItemId: "work-item-3",
        linkType: "Related",
      })
    )
  })
})
