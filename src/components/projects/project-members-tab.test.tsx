import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { ProjectMembersTab } from "@/components/projects/project-members-tab"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"

const ORGANIZATION_ID = "org-1"
const PROJECT_ID = "project-1"

const roles = [
  { id: "role-admin", name: "Admin", scope: "Project" },
  { id: "role-contributor", name: "Contributor", scope: "Project" },
]

function mockMembers(
  items: {
    id: string
    fullName: string
    email: string
    roleId?: string
    roleName?: string
  }[]
) {
  server.use(
    http.get(
      `*/api/organizations/${ORGANIZATION_ID}/projects/${PROJECT_ID}/users`,
      () =>
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
    http.get(`*/api/projects/${PROJECT_ID}/effective-permissions`, () =>
      HttpResponse.json(permissions)
    ),
    http.get("*/api/roles", () => HttpResponse.json(roles))
  )
}

describe("ProjectMembersTab", () => {
  it("shows an empty state when there are no members", async () => {
    mockPermissions([])
    mockMembers([])

    renderWithProviders(
      <ProjectMembersTab organizationId={ORGANIZATION_ID} projectId={PROJECT_ID} />
    )

    expect(await screen.findByText("No members yet.")).toBeInTheDocument()
  })

  it("shows a read-only role badge and no remove action for a caller who cannot manage members", async () => {
    mockPermissions(["ProjectView"])
    mockMembers([
      {
        id: "user-1",
        fullName: "John Doe",
        email: "john@mirai.com",
        roleId: "role-contributor",
        roleName: "Contributor",
      },
    ])

    renderWithProviders(
      <ProjectMembersTab organizationId={ORGANIZATION_ID} projectId={PROJECT_ID} />
    )

    await screen.findByText("John Doe")

    expect(screen.getByText("Contributor")).toBeInTheDocument()
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /remove john doe/i })
    ).not.toBeInTheDocument()
  })

  it("allows a caller with ManageMembers to change a member's role", async () => {
    mockPermissions(["ProjectManageMembers"])
    mockMembers([
      {
        id: "user-1",
        fullName: "John Doe",
        email: "john@mirai.com",
        roleId: "role-contributor",
        roleName: "Contributor",
      },
    ])
    let requestBody: unknown
    server.use(
      http.put(
        `*/api/organizations/${ORGANIZATION_ID}/projects/${PROJECT_ID}/users/user-1/role`,
        async ({ request }) => {
          requestBody = await request.json()
          return new HttpResponse(null, { status: 204 })
        }
      )
    )

    const user = userEvent.setup()
    renderWithProviders(
      <ProjectMembersTab organizationId={ORGANIZATION_ID} projectId={PROJECT_ID} />
    )

    await user.click(await screen.findByRole("combobox"))
    await user.click(await screen.findByRole("option", { name: "Admin" }))

    await waitFor(() =>
      expect(requestBody).toEqual({ roleId: "role-admin" })
    )
  })

  it("allows a caller with ManageMembers to remove a member", async () => {
    mockPermissions(["ProjectManageMembers"])
    mockMembers([
      {
        id: "user-1",
        fullName: "John Doe",
        email: "john@mirai.com",
        roleId: "role-contributor",
        roleName: "Contributor",
      },
    ])
    let removeRequested = false
    server.use(
      http.delete(
        `*/api/organizations/${ORGANIZATION_ID}/projects/${PROJECT_ID}/users/user-1`,
        () => {
          removeRequested = true
          return new HttpResponse(null, { status: 204 })
        }
      )
    )

    const user = userEvent.setup()
    renderWithProviders(
      <ProjectMembersTab organizationId={ORGANIZATION_ID} projectId={PROJECT_ID} />
    )

    await user.click(
      await screen.findByRole("button", { name: /remove john doe/i })
    )
    await user.click(screen.getByRole("button", { name: /^remove$/i }))

    await waitFor(() => expect(removeRequested).toBe(true))
  })
})
