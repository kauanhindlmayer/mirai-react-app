import { http, HttpResponse } from "msw"
import { describe, expect, it, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"

import { useMentionableProjectUsers } from "@/hooks/use-mentionable-project-users"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"

function mockMentionableUsers(members: Array<{ id: string; fullName: string }>) {
  server.use(
    http.get(
      "*/api/organizations/org-1/projects/project-1/users/mentionable",
      () =>
        HttpResponse.json({
          items: members,
          totalCount: members.length,
          pageSize: 100,
          page: 1,
          hasNextPage: false,
          hasPreviousPage: false,
          totalPages: 1,
        })
    )
  )
}

function mockResolvedUsers(
  users: Array<{ id: string; fullName: string }>,
  handler = vi.fn(() => HttpResponse.json(users))
) {
  server.use(
    http.get(
      "*/api/organizations/org-1/projects/project-1/users/resolve",
      handler
    )
  )
  return handler
}

function TestResolveMention({ userId }: { userId: string }) {
  const { useResolveMention } = useMentionableProjectUsers("org-1", "project-1")
  const resolved = useResolveMention(userId)
  return <div>{resolved?.fullName ?? "resolving..."}</div>
}

describe("useMentionableProjectUsers", () => {
  it("resolves a current project member without calling the fallback endpoint", async () => {
    mockMentionableUsers([{ id: "user-1", fullName: "Jane Smith" }])
    const resolveHandler = mockResolvedUsers([])

    renderWithProviders(<TestResolveMention userId="user-1" />)

    expect(await screen.findByText("Jane Smith")).toBeInTheDocument()
    expect(resolveHandler).not.toHaveBeenCalled()
  })

  it("falls back to the resolve endpoint for a user no longer on the project", async () => {
    mockMentionableUsers([])
    mockResolvedUsers([{ id: "user-2", fullName: "Former Member" }])

    renderWithProviders(<TestResolveMention userId="user-2" />)

    expect(await screen.findByText("Former Member")).toBeInTheDocument()
  })

  it("shows a generic placeholder when the user resolves nowhere", async () => {
    mockMentionableUsers([])
    mockResolvedUsers([])

    renderWithProviders(<TestResolveMention userId="user-404" />)

    await waitFor(() =>
      expect(screen.getByText("Unknown user")).toBeInTheDocument()
    )
  })
})
