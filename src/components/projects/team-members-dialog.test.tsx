import { http, HttpResponse } from "msw"
import { describe, expect, it, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { TeamMembersDialog } from "@/components/projects/team-members-dialog"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"
import type { Team } from "@/types/teams"

const ORGANIZATION_ID = "org-1"
const PROJECT_ID = "project-1"

const team: Team = {
  id: "team-1",
  name: "Engineering",
  description: "",
  boardId: "board-1",
  isDefault: false,
  memberCount: 1,
}

const roles = [
  { id: "role-admin", name: "Admin", scope: "Team" },
  { id: "role-member", name: "Team Member", scope: "Team" },
]

function mockMembers(
  items: { id: string; name: string; roleId?: string; roleName?: string }[]
) {
  server.use(
    http.get(`*/api/projects/${PROJECT_ID}/teams/${team.id}/members`, () =>
      HttpResponse.json({
        items,
        totalCount: items.length,
        pageSize: 10,
        page: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        totalPages: 1,
      })
    )
  )
}

function mockPermissions(permissions: string[]) {
  server.use(
    http.get(`*/api/teams/${team.id}/effective-permissions`, () =>
      HttpResponse.json(permissions)
    ),
    http.get("*/api/roles", () => HttpResponse.json(roles))
  )
}

function renderDialog() {
  return renderWithProviders(
    <TeamMembersDialog
      organizationId={ORGANIZATION_ID}
      projectId={PROJECT_ID}
      team={team}
      open
      onOpenChange={vi.fn()}
    />
  )
}

describe("TeamMembersDialog", () => {
  it("shows an empty state when there are no members", async () => {
    mockPermissions([])
    mockMembers([])

    renderDialog()

    expect(await screen.findByText("No members yet.")).toBeInTheDocument()
  })

  it("shows a read-only role badge and no remove action for a caller who cannot manage members", async () => {
    mockPermissions(["TeamView"])
    mockMembers([
      { id: "user-1", name: "John Doe", roleId: "role-member", roleName: "Team Member" },
    ])

    renderDialog()

    await screen.findByText("John Doe")

    expect(screen.getByText("Team Member")).toBeInTheDocument()
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /remove john doe/i })
    ).not.toBeInTheDocument()
  })

  it("allows a caller with ManageMembers to change a member's role", async () => {
    mockPermissions(["TeamManageMembers"])
    mockMembers([
      { id: "user-1", name: "John Doe", roleId: "role-member", roleName: "Team Member" },
    ])
    let requestBody: unknown
    server.use(
      http.put(
        `*/api/projects/${PROJECT_ID}/teams/${team.id}/members/user-1/role`,
        async ({ request }) => {
          requestBody = await request.json()
          return new HttpResponse(null, { status: 204 })
        }
      )
    )

    const user = userEvent.setup()
    renderDialog()

    await user.click(await screen.findByRole("combobox"))
    await user.click(await screen.findByRole("option", { name: "Admin" }))

    await waitFor(() => expect(requestBody).toEqual({ roleId: "role-admin" }))
  })

  it("allows a caller with ManageMembers to remove a member", async () => {
    mockPermissions(["TeamManageMembers"])
    mockMembers([
      { id: "user-1", name: "John Doe", roleId: "role-member", roleName: "Team Member" },
    ])
    let removeRequested = false
    server.use(
      http.delete(
        `*/api/projects/${PROJECT_ID}/teams/${team.id}/members/user-1`,
        () => {
          removeRequested = true
          return new HttpResponse(null, { status: 204 })
        }
      )
    )

    const user = userEvent.setup()
    renderDialog()

    await user.click(
      await screen.findByRole("button", { name: /remove john doe/i })
    )
    await user.click(screen.getByRole("button", { name: /^remove$/i }))

    await waitFor(() => expect(removeRequested).toBe(true))
  })
})
