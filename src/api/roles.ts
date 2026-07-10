import { get, put } from "@/lib/api-client"
import type { Role, RoleScope } from "@/types/roles"

export function listRoles(scope?: RoleScope): Promise<Role[]> {
  const params: Record<string, string> = {}
  if (scope) params.scope = scope
  return get("/roles", { params })
}

export function getOrganizationEffectivePermissions(
  organizationId: string
): Promise<string[]> {
  return get(`/organizations/${organizationId}/effective-permissions`)
}

export function getProjectEffectivePermissions(
  projectId: string
): Promise<string[]> {
  return get(`/projects/${projectId}/effective-permissions`)
}

export function getTeamEffectivePermissions(
  teamId: string
): Promise<string[]> {
  return get(`/teams/${teamId}/effective-permissions`)
}

export function changeOrganizationMemberRole(
  organizationId: string,
  userId: string,
  roleId: string
): Promise<void> {
  return put(`/organizations/${organizationId}/users/${userId}/role`, {
    roleId,
  })
}

export function changeProjectMemberRole(
  organizationId: string,
  projectId: string,
  userId: string,
  roleId: string
): Promise<void> {
  return put(
    `/organizations/${organizationId}/projects/${projectId}/users/${userId}/role`,
    { roleId }
  )
}

export function changeTeamMemberRole(
  projectId: string,
  teamId: string,
  userId: string,
  roleId: string
): Promise<void> {
  return put(
    `/projects/${projectId}/teams/${teamId}/members/${userId}/role`,
    { roleId }
  )
}
