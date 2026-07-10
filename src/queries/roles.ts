import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  changeOrganizationMemberRole,
  changeProjectMemberRole,
  changeTeamMemberRole,
  getOrganizationEffectivePermissions,
  getProjectEffectivePermissions,
  getTeamEffectivePermissions,
  listRoles,
} from "@/api/roles"
import { organizationUsersQueryKey } from "@/queries/organizations"
import { projectUsersQueryKey } from "@/queries/projects"
import { teamMembersQueryKey } from "@/queries/teams"
import { createErrorToastHandler } from "@/lib/query-helpers"
import type { RoleScope } from "@/types/roles"

export function rolesQueryKey(scope?: RoleScope) {
  return ["roles", scope]
}

export function useRolesQuery(scope?: RoleScope) {
  return useQuery({
    queryKey: rolesQueryKey(scope),
    queryFn: () => listRoles(scope),
    staleTime: Infinity,
    placeholderData: [],
  })
}

export function organizationEffectivePermissionsQueryKey(
  organizationId: string
) {
  return ["effective-permissions", "organization", organizationId]
}

export function useOrganizationEffectivePermissionsQuery(
  organizationId: string | undefined
) {
  return useQuery({
    queryKey: organizationEffectivePermissionsQueryKey(organizationId ?? ""),
    queryFn: () => getOrganizationEffectivePermissions(organizationId ?? ""),
    enabled: !!organizationId,
    staleTime: 60_000,
    placeholderData: [],
  })
}

export function projectEffectivePermissionsQueryKey(projectId: string) {
  return ["effective-permissions", "project", projectId]
}

export function useProjectEffectivePermissionsQuery(
  projectId: string | undefined
) {
  return useQuery({
    queryKey: projectEffectivePermissionsQueryKey(projectId ?? ""),
    queryFn: () => getProjectEffectivePermissions(projectId ?? ""),
    enabled: !!projectId,
    staleTime: 60_000,
    placeholderData: [],
  })
}

export function teamEffectivePermissionsQueryKey(teamId: string) {
  return ["effective-permissions", "team", teamId]
}

export function useTeamEffectivePermissionsQuery(teamId: string | undefined) {
  return useQuery({
    queryKey: teamEffectivePermissionsQueryKey(teamId ?? ""),
    queryFn: () => getTeamEffectivePermissions(teamId ?? ""),
    enabled: !!teamId,
    staleTime: 60_000,
    placeholderData: [],
  })
}

export function useChangeOrganizationMemberRoleMutation(
  organizationId: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      changeOrganizationMemberRole(organizationId, userId, roleId),
    onError: createErrorToastHandler("Failed to change member role."),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: organizationUsersQueryKey(organizationId),
      })
      queryClient.invalidateQueries({
        queryKey: organizationEffectivePermissionsQueryKey(organizationId),
      })
      toast.success("Member role updated.")
    },
  })
}

export function useChangeProjectMemberRoleMutation(
  organizationId: string,
  projectId: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      changeProjectMemberRole(organizationId, projectId, userId, roleId),
    onError: createErrorToastHandler("Failed to change member role."),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: projectUsersQueryKey(organizationId, projectId),
      })
      queryClient.invalidateQueries({
        queryKey: projectEffectivePermissionsQueryKey(projectId),
      })
      toast.success("Member role updated.")
    },
  })
}

export function useChangeTeamMemberRoleMutation(
  projectId: string,
  teamId: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      changeTeamMemberRole(projectId, teamId, userId, roleId),
    onError: createErrorToastHandler("Failed to change member role."),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: teamMembersQueryKey(projectId, teamId),
      })
      queryClient.invalidateQueries({
        queryKey: teamEffectivePermissionsQueryKey(teamId),
      })
      toast.success("Member role updated.")
    },
  })
}
