import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("@/hooks/use-current-project", () => ({
  useCurrentProject: () => ({
    projectId: "project-1",
    project: { id: "project-1", organizationId: "org-1" },
  }),
}))

import { WikiPageComments } from "@/components/wiki-pages/wiki-page-comments"
import { setAccessToken } from "@/lib/auth-storage"
import { server } from "@/test/mocks/server"
import { mockProjectUsers } from "@/test/mocks/project-users"
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

    await user.click(screen.getByRole("textbox", { name: "Add a comment" }))
    await user.type(
      screen.getByRole("textbox", { name: "Add a comment" }),
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

    const composer = screen.getByRole("textbox", { name: "Add a comment" })
    await user.click(composer)
    await user.type(composer, "A new comment")
    await user.click(screen.getByRole("button", { name: "Comment" }))

    await waitFor(() =>
      expect(
        screen.getByRole("textbox", { name: "Add a comment" })
      ).toHaveTextContent("")
    )
  })

  it("mentions a project member in a new comment", async () => {
    mockProjectUsers()
    let requestBody: unknown
    server.use(
      http.post(
        "*/api/projects/project-1/wiki-pages/wiki-page-1/comments",
        async ({ request }) => {
          requestBody = await request.json()
          return new HttpResponse(null, { status: 204 })
        }
      )
    )

    const user = userEvent.setup()
    renderComments([])

    const composer = screen.getByRole("textbox", { name: "Add a comment" })
    await user.click(composer)
    await user.type(composer, "@jane")

    expect(await screen.findByText("Jane Smith")).toBeInTheDocument()
    await user.keyboard("{Enter}")

    await waitFor(() =>
      expect(
        composer.querySelector("[data-mention-user-id='user-2']")
      ).toBeInTheDocument()
    )

    await user.click(screen.getByRole("button", { name: "Comment" }))

    await waitFor(() =>
      expect(requestBody).toEqual({
        content: expect.stringContaining('data-id="user-2"'),
      })
    )
  })

  it("renders an existing mention in a saved comment on reload", async () => {
    mockProjectUsers()
    renderComments([
      buildComment({
        content:
          'Thanks <span data-type="mention" data-id="user-2" data-label="Jane Smith">@Jane Smith</span>',
      }),
    ])

    await waitFor(() =>
      expect(
        document.querySelector("[data-mention-user-id='user-2']")
      ).toHaveTextContent("Jane Smith")
    )
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

    expect(
      screen.getByRole("textbox", { name: "Edit comment" })
    ).toHaveTextContent("Original content")
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument()
  })

  it("cancels editing without saving changes", async () => {
    signInAs("user-1")

    // No artificial per-keystroke delay: under CI/system load, a slower
    // wall-clock gap between keystrokes gives Tiptap/React's async render
    // cycle a chance to interleave with in-progress typing (see the
    // MentionableEditor content-sync effect this typing risks racing with).
    const user = userEvent.setup({ delay: null })
    renderComments([buildComment({ content: "Original content" })])

    await user.click(await screen.findByRole("button", { name: "Edit" }))
    const editBox = screen.getByRole("textbox", { name: "Edit comment" })
    await user.click(editBox)
    await user.type(editBox, " - changed")
    await user.click(screen.getByRole("button", { name: "Cancel" }))

    expect(screen.getByText("Original content")).toBeInTheDocument()
    expect(screen.queryByText(/changed/)).not.toBeInTheDocument()
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

    // No artificial per-keystroke delay: under CI/system load, a slower
    // wall-clock gap between keystrokes gives Tiptap/React's async render
    // cycle a chance to interleave with in-progress typing (see the
    // MentionableEditor content-sync effect this typing risks racing with).
    const user = userEvent.setup({ delay: null })
    renderComments([buildComment({ content: "Original content" })])

    await user.click(await screen.findByRole("button", { name: "Edit" }))
    const editBox = screen.getByRole("textbox", { name: "Edit comment" })
    await user.click(editBox)
    await user.type(editBox, " - updated")
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() =>
      expect(requestBody).toEqual({
        content: "<p>Original content - updated</p>",
      })
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
