import {
  useOrganizationEffectivePermissionsQuery,
  useProjectEffectivePermissionsQuery,
  useTeamEffectivePermissionsQuery,
} from "@/queries/roles"
import { RoleScope, type Permission } from "@/types/roles"

/**
 * Fail-closed permission check: returns false while the underlying query is
 * loading or the caller lacks the permission, never defaulting to "allowed".
 * The backend is the real security boundary - this only gates UI affordances.
 */
export function useCan(
  scope: RoleScope,
  resourceId: string | undefined,
  permission: Permission
): boolean {
  const organizationPermissions = useOrganizationEffectivePermissionsQuery(
    scope === RoleScope.Organization ? resourceId : undefined
  )
  const projectPermissions = useProjectEffectivePermissionsQuery(
    scope === RoleScope.Project ? resourceId : undefined
  )
  const teamPermissions = useTeamEffectivePermissionsQuery(
    scope === RoleScope.Team ? resourceId : undefined
  )

  switch (scope) {
    case RoleScope.Organization:
      return (organizationPermissions.data ?? []).includes(permission)
    case RoleScope.Project:
      return (projectPermissions.data ?? []).includes(permission)
    case RoleScope.Team:
      return (teamPermissions.data ?? []).includes(permission)
  }
}
