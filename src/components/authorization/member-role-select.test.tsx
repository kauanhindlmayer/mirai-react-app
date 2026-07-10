import { http, HttpResponse } from "msw"
import { describe, expect, it, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { MemberRoleSelect } from "@/components/authorization/member-role-select"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"
import { RoleScope } from "@/types/roles"

const roles = [
  { id: "role-admin", name: "Admin", scope: RoleScope.Organization },
  { id: "role-member", name: "Member", scope: RoleScope.Organization },
]

function mockRoles() {
  server.use(
    http.get("*/api/roles", () => HttpResponse.json(roles))
  )
}

describe("MemberRoleSelect", () => {
  it("renders a read-only badge when the caller cannot manage members", () => {
    mockRoles()

    renderWithProviders(
      <MemberRoleSelect
        scope={RoleScope.Organization}
        roleId="role-member"
        roleName="Member"
        canManage={false}
        onChange={vi.fn()}
      />
    )

    expect(screen.getByText("Member")).toBeInTheDocument()
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
  })

  it("renders an editable select when the caller can manage members", async () => {
    mockRoles()

    renderWithProviders(
      <MemberRoleSelect
        scope={RoleScope.Organization}
        roleId="role-member"
        roleName="Member"
        canManage
        onChange={vi.fn()}
      />
    )

    await waitFor(() =>
      expect(screen.getByRole("combobox")).toBeInTheDocument()
    )
  })

  it("calls onChange with the selected role's id", async () => {
    mockRoles()
    const onChange = vi.fn()
    const user = userEvent.setup()

    renderWithProviders(
      <MemberRoleSelect
        scope={RoleScope.Organization}
        roleId="role-member"
        roleName="Member"
        canManage
        onChange={onChange}
      />
    )

    await user.click(await screen.findByRole("combobox"))
    await user.click(await screen.findByRole("option", { name: "Admin" }))

    expect(onChange).toHaveBeenCalledWith("role-admin")
  })

  it("disables the select while a role change is in flight", async () => {
    mockRoles()

    renderWithProviders(
      <MemberRoleSelect
        scope={RoleScope.Organization}
        roleId="role-member"
        roleName="Member"
        canManage
        disabled
        onChange={vi.fn()}
      />
    )

    await waitFor(() =>
      expect(screen.getByRole("combobox")).toBeDisabled()
    )
  })
})
