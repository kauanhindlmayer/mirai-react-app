import { del, delWithBody, get, post, put } from "@/lib/api-client"
import type { PaginatedList, PaginationFilter } from "@/types/common"
import type { CreateTagRequest, Tag, UpdateTagRequest } from "@/types/tags"

export function listTags(
  projectId: string,
  filters: PaginationFilter
): Promise<PaginatedList<Tag>> {
  const params: Record<string, string> = {
    page: filters.page.toString(),
    pageSize: filters.pageSize.toString(),
  }
  if (filters.sort) params.sort = filters.sort
  if (filters.searchTerm) params.q = filters.searchTerm
  return get(`/projects/${projectId}/tags`, { params })
}

export function createTag(
  projectId: string,
  request: CreateTagRequest
): Promise<void> {
  return post(`/projects/${projectId}/tags`, request)
}

export function deleteTag(projectId: string, tagId: string): Promise<void> {
  return del(`/projects/${projectId}/tags/${tagId}`)
}

export function deleteTags(projectId: string, tagIds: string[]): Promise<void> {
  return delWithBody(`/projects/${projectId}/tags/bulk`, { tagIds })
}

export function updateTag(
  projectId: string,
  tagId: string,
  request: UpdateTagRequest
): Promise<void> {
  return put(`/projects/${projectId}/tags/${tagId}`, request)
}
