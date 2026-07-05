import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { WikiPageComments } from "@/components/wiki-pages/wiki-page-comments"
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

function renderComments(comments: Comment[]) {
  return renderWithProviders(
    <WikiPageComments
      projectId="project-1"
      wikiPageId="wiki-page-1"
      comments={comments}
    />
  )
}

beforeEach(() => {
  localStorage.clear()
})

describe("WikiPageComments", () => {
  it("renders a placeholder when there are no comments", () => {
    renderComments([])

    expect(screen.getByText("No comments yet.")).toBeInTheDocument()
  })

  it("renders existing comments", () => {
    renderComments([buildComment({ content: "Nice write-up!" })])

    expect(screen.getByText("John Doe")).toBeInTheDocument()
    expect(screen.getByText("Nice write-up!")).toBeInTheDocument()
  })

  it("disables the submit button until a comment is typed", async () => {
    const user = userEvent.setup()
    renderComments([])

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
        "*/api/projects/project-1/wiki-pages/wiki-page-1/comments",
        () => new HttpResponse(null, { status: 204 })
      )
    )

    const user = userEvent.setup()
    renderComments([])

    const textarea = screen.getByPlaceholderText("Add a comment...")
    await user.type(textarea, "A new comment")
    await user.click(screen.getByRole("button", { name: "Comment" }))

    await waitFor(() => expect(textarea).toHaveValue(""))
  })

  it("shows edit/delete controls only for the current user's own comment", async () => {
    signInAs("user-1")

    renderComments([
      buildComment({
        id: "own-comment",
        author: { id: "user-1", name: "John Doe", imageUrl: "" },
      }),
      buildComment({
        id: "other-comment",
        author: { id: "user-2", name: "Jane Smith", imageUrl: "" },
      }),
    ])

    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: "Edit" })).toHaveLength(1)
    )
  })

  it("replaces the comment with an editable draft when Edit is clicked", async () => {
    signInAs("user-1")

    const user = userEvent.setup()
    renderComments([buildComment({ content: "Original content" })])

    await user.click(await screen.findByRole("button", { name: "Edit" }))

    expect(screen.getByDisplayValue("Original content")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument()
  })

  it("cancels editing without saving changes", async () => {
    signInAs("user-1")

    const user = userEvent.setup()
    renderComments([buildComment({ content: "Original content" })])

    await user.click(await screen.findByRole("button", { name: "Edit" }))
    const editTextarea = screen.getByDisplayValue("Original content")
    await user.clear(editTextarea)
    await user.type(editTextarea, "Changed content")
    await user.click(screen.getByRole("button", { name: "Cancel" }))

    expect(screen.getByText("Original content")).toBeInTheDocument()
    expect(screen.queryByText("Changed content")).not.toBeInTheDocument()
  })

  it("saves an edited comment", async () => {
    signInAs("user-1")

    let requestBody: unknown
    server.use(
      http.put(
        "*/api/projects/project-1/wiki-pages/wiki-page-1/comments/comment-1",
        async ({ request }) => {
          requestBody = await request.json()
          return new HttpResponse(null, { status: 204 })
        }
      )
    )

    const user = userEvent.setup()
    renderComments([buildComment({ content: "Original content" })])

    await user.click(await screen.findByRole("button", { name: "Edit" }))
    const editTextarea = screen.getByDisplayValue("Original content")
    await user.clear(editTextarea)
    await user.type(editTextarea, "Updated content")
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() =>
      expect(requestBody).toEqual({ content: "Updated content" })
    )
  })

  it("calls the delete endpoint when Delete is clicked", async () => {
    signInAs("user-1")

    let deleteRequestCount = 0
    server.use(
      http.delete(
        "*/api/projects/project-1/wiki-pages/wiki-page-1/comments/comment-1",
        () => {
          deleteRequestCount += 1
          return new HttpResponse(null, { status: 204 })
        }
      )
    )

    const user = userEvent.setup()
    renderComments([buildComment()])

    await user.click(await screen.findByRole("button", { name: "Delete" }))

    await waitFor(() => expect(deleteRequestCount).toBe(1))
  })
})
