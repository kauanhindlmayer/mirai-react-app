import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  addUserToOrganization,
  createOrganization,
  getOrganizationUsers,
  listOrganizations,
} from "@/api/organizations"
import { createErrorToastHandler } from "@/lib/query-helpers"
import type {
  AddUserToOrganizationRequest,
  CreateOrganizationRequest,
} from "@/types/organizations"
import type { PaginationFilter } from "@/types/common"

export function organizationsQueryKey() {
  return ["organizations"]
}

export function useOrganizationsQuery() {
  return useQuery({
    queryKey: organizationsQueryKey(),
    queryFn: listOrganizations,
    staleTime: 60_000,
    placeholderData: [],
  })
}

export function organizationUsersQueryKey(organizationId: string) {
  return ["organization-users", organizationId]
}

export function useOrganizationUsersQuery(
  organizationId: string,
  filters: PaginationFilter,
  excludeProjectId?: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [
      ...organizationUsersQueryKey(organizationId),
      filters,
      excludeProjectId,
    ],
    queryFn: () =>
      getOrganizationUsers(organizationId, filters, excludeProjectId),
    enabled: (options?.enabled ?? true) && !!organizationId,
    staleTime: 60_000,
    placeholderData: (previous) => previous,
  })
}

export function useCreateOrganizationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateOrganizationRequest) =>
      createOrganization(request),
    onError: createErrorToastHandler("Failed to create organization."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationsQueryKey() })
      toast.success("Organization created.")
    },
  })
}

export function useAddUserToOrganizationMutation(organizationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: AddUserToOrganizationRequest) =>
      addUserToOrganization(organizationId, request),
    onError: createErrorToastHandler("Failed to invite member."),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: organizationUsersQueryKey(organizationId),
      })
      toast.success("Member invited.")
    },
  })
}
