import { get, post } from "@/lib/api-client"
import type { PaginatedList, PaginationFilter } from "@/types/common"
import type {
  AddUserToOrganizationRequest,
  CreateOrganizationRequest,
  Organization,
  OrganizationUserResponse,
} from "@/types/organizations"

export function createOrganization(
  request: CreateOrganizationRequest
): Promise<string> {
  return post("/organizations", request)
}

export function listOrganizations(): Promise<Organization[]> {
  return get("/organizations")
}

export function getOrganizationUsers(
  organizationId: string,
  filters: PaginationFilter,
  excludeProjectId?: string
): Promise<PaginatedList<OrganizationUserResponse>> {
  const params: Record<string, string> = {
    page: filters.page.toString(),
    pageSize: filters.pageSize.toString(),
  }
  if (filters.sort) params.sort = filters.sort
  if (filters.searchTerm) params.searchTerm = filters.searchTerm
  if (excludeProjectId) params.excludeProjectId = excludeProjectId
  return get(`/organizations/${organizationId}/users`, { params })
}

export function addUserToOrganization(
  organizationId: string,
  request: AddUserToOrganizationRequest
): Promise<void> {
  return post(`/organizations/${organizationId}/users`, request)
}
