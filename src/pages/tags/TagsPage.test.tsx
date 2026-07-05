import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Route, Routes } from "react-router"

import TagsPage from "@/pages/tags/TagsPage"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"
import type { Tag } from "@/types/tags"

function buildTag(overrides: Partial<Tag> = {}): Tag {
  return {
    id: "tag-1",
    name: "bug",
    description: "Something is broken",
    color: "#ff0000",
    workItemsCount: 3,
    ...overrides,
  }
}

function mockTags(items: Tag[]) {
  server.use(
    http.get("*/api/projects/project-1/tags", () =>
      HttpResponse.json({
        items,
        totalCount: items.length,
        pageSize: 20,
        page: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        totalPages: 1,
      })
    )
  )
}

function renderTagsPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/projects/:projectId/tags" element={<TagsPage />} />
    </Routes>,
    { route: "/projects/project-1/tags" }
  )
}

describe("TagsPage", () => {
  it("lists tags with their description and work item count", async () => {
    mockTags([buildTag()])
    renderTagsPage()

    expect(
      await screen.findByRole("button", { name: "bug" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Something is broken" })
    ).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
  })

  it("shows an empty state when there are no tags", async () => {
    mockTags([])
    renderTagsPage()

    expect(await screen.findByText("No tags yet.")).toBeInTheDocument()
  })

  it("links to the tag import page", () => {
    mockTags([])
    renderTagsPage()

    expect(screen.getByRole("link", { name: /import/i })).toHaveAttribute(
      "href",
      "/projects/project-1/tags/import"
    )
  })

  it("deletes a tag when its delete button is clicked", async () => {
    mockTags([buildTag()])
    let deleteRequestCount = 0
    server.use(
      http.delete("*/api/projects/project-1/tags/tag-1", () => {
        deleteRequestCount += 1
        return new HttpResponse(null, { status: 204 })
      })
    )

    const user = userEvent.setup()
    renderTagsPage()

    await user.click(await screen.findByRole("button", { name: "Delete bug" }))

    await waitFor(() => expect(deleteRequestCount).toBe(1))
  })

  it("saves an inline-edited name while preserving the other fields", async () => {
    mockTags([buildTag()])
    let requestBody: unknown
    server.use(
      http.put("*/api/projects/project-1/tags/tag-1", async ({ request }) => {
        requestBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      })
    )

    const user = userEvent.setup()
    renderTagsPage()

    await user.click(await screen.findByRole("button", { name: "bug" }))
    const input = screen.getByRole("textbox")
    await user.clear(input)
    await user.type(input, "defect")
    await user.tab()

    await waitFor(() =>
      expect(requestBody).toEqual({
        name: "defect",
        description: "Something is broken",
        color: "#ff0000",
      })
    )
  })

  it("shows a bulk-delete button when tags are selected and clears selection after deleting", async () => {
    mockTags([buildTag(), buildTag({ id: "tag-2", name: "feature" })])
    let requestBody: unknown
    server.use(
      http.delete("*/api/projects/project-1/tags/bulk", async ({ request }) => {
        requestBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      })
    )

    const user = userEvent.setup()
    renderTagsPage()

    await user.click(
      await screen.findByRole("checkbox", { name: "Select bug" })
    )
    await user.click(screen.getByRole("button", { name: "Delete 1 tag" }))

    await waitFor(() => expect(requestBody).toEqual({ tagIds: ["tag-1"] }))
    expect(
      screen.queryByRole("button", { name: /delete \d+ tags?/i })
    ).not.toBeInTheDocument()
  })
})
