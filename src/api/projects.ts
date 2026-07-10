import { del, get, post, put } from "@/lib/api-client"
import type { PaginatedList } from "@/types/common"
import type { Project } from "@/types/projects"
import type { ProjectUserResponse } from "@/types/work-items"

export function createProject(project: Partial<Project>): Promise<string> {
  return post(`/organizations/${project.organizationId}/projects`, project)
}

export function getProject(projectId: string): Promise<Project> {
  return get(`/projects/${projectId}`)
}

export function listProjects(organizationId: string): Promise<Project[]> {
  return get(`/organizations/${organizationId}/projects`)
}

export function updateProject(
  project: Partial<Project> & { id: string }
): Promise<string> {
  return put(
    `/organizations/${project.organizationId}/projects/${project.id}`,
    project
  )
}

export function deleteProject(
  organizationId: string,
  projectId: string
): Promise<void> {
  return del(`/organizations/${organizationId}/projects/${projectId}`)
}

export function getProjectUsers(
  organizationId: string,
  projectId: string,
  searchTerm?: string,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedList<ProjectUserResponse>> {
  const params: Record<string, string> = {
    page: page.toString(),
    pageSize: pageSize.toString(),
  }
  if (searchTerm) params.q = searchTerm
  return get(`/organizations/${organizationId}/projects/${projectId}/users`, {
    params,
  })
}

export function addUserToProject(
  organizationId: string,
  projectId: string,
  userId: string
): Promise<void> {
  return post(`/organizations/${organizationId}/projects/${projectId}/users`, {
    userId,
  })
}

export function removeUserFromProject(
  organizationId: string,
  projectId: string,
  userId: string
): Promise<void> {
  return del(
    `/organizations/${organizationId}/projects/${projectId}/users/${userId}`
  )
}
