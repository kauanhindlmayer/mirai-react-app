import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactElement } from "react"

import { WorkItemComments } from "@/components/work-items/work-item-comments"
import { WorkItemProvider } from "@/components/work-items/work-item-context"
import { setAccessToken } from "@/lib/auth-storage"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"
import type { Comment } from "@/types/common"

function buildToken(payload: Record<string, unknown>): string {
  return `header.${btoa(JSON.stringify(payload))}.signature`
}

function signInAs(userId: string) {
  setAccessToken(buildToken({ exp: Math.floor(Date.now() / 1000) + 3600 }))
  server.use(
    http.get("*/api/users/me", () =>
      HttpResponse.json({
        id: userId,
        email: "john.doe@mirai.com",
        firstName: "John",
        lastName: "Doe",
        fullName: "John Doe",
        imageUrl: "",
      })
    )
  )
}

beforeEach(() => {
  localStorage.clear()
})

function renderComments(ui: ReactElement) {
  return renderWithProviders(
    <WorkItemProvider projectId="project-1" workItemId="work-item-1">
      {ui}
    </WorkItemProvider>
  )
}

function buildComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: "comment-1",
    author: { id: "user-1", name: "John Doe", imageUrl: "" },
    content: "Looks good to me.",
    createdAtUtc: "2026-01-01T00:00:00Z",
    updatedAtUtc: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

describe("WorkItemComments", () => {
  it("renders a placeholder when there are no comments", () => {
    renderComments(<WorkItemComments comments={[]} />)

    expect(screen.getByText("No comments yet.")).toBeInTheDocument()
  })

  it("renders existing comments", () => {
    renderComments(
      <WorkItemComments comments={[buildComment({ content: "Nice work!" })]} />
    )

    expect(screen.getByText("John Doe")).toBeInTheDocument()
    expect(screen.getByText("Nice work!")).toBeInTheDocument()
  })

  it("disables the submit button until a comment is typed", async () => {
    const user = userEvent.setup()
    renderComments(<WorkItemComments comments={[]} />)

    const submit = screen.getByRole("button", { name: "Comment" })
    expect(submit).toBeDisabled()

    await user.type(
      screen.getByPlaceholderText("Add a comment..."),
      "A new comment"
    )
    expect(submit).toBeEnabled()
  })

  it("submits a new comment and clears the draft on success", async () => {
    server.use(
      http.post(
        "*/api/projects/project-1/work-items/work-item-1/comments",
        () => new HttpResponse(null, { status: 204 })
      )
    )

    const user = userEvent.setup()
    renderComments(<WorkItemComments comments={[]} />)

    const textarea = screen.getByPlaceholderText("Add a comment...")
    await user.type(textarea, "A new comment")
    await user.click(screen.getByRole("button", { name: "Comment" }))

    await waitFor(() => expect(textarea).toHaveValue(""))
  })

  it("shows edit/delete controls only for the current user's own comment", async () => {
    signInAs("user-1")

    renderComments(
      <WorkItemComments
        comments={[
          buildComment({
            id: "own-comment",
            author: { id: "user-1", name: "John Doe", imageUrl: "" },
          }),
          buildComment({
            id: "other-comment",
            author: { id: "user-2", name: "Jane Smith", imageUrl: "" },
          }),
        ]}
      />
    )

    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: "Edit" })).toHaveLength(1)
    )
  })

  it("calls the delete endpoint when Delete is clicked", async () => {
    signInAs("user-1")

    let deleteRequestCount = 0
    server.use(
      http.delete(
        "*/api/projects/project-1/work-items/work-item-1/comments/comment-1",
        () => {
          deleteRequestCount += 1
          return new HttpResponse(null, { status: 204 })
        }
      )
    )

    const user = userEvent.setup()
    renderComments(
      <WorkItemComments
        comments={[
          buildComment({
            author: { id: "user-1", name: "John Doe", imageUrl: "" },
          }),
        ]}
      />
    )

    await user.click(await screen.findByRole("button", { name: "Delete" }))

    await waitFor(() => expect(deleteRequestCount).toBe(1))
  })
})
