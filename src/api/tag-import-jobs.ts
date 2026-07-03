import { get, post } from "@/lib/api-client"
import type {
  HateoasResponse,
  PaginatedList,
  PaginationFilter,
} from "@/types/common"
import type { TagImportJob } from "@/types/tag-import-jobs"

export function listTagImportJobs(
  projectId: string,
  filters: PaginationFilter
): Promise<PaginatedList<TagImportJob> & HateoasResponse> {
  const params: Record<string, string> = {
    page: filters.page.toString(),
    pageSize: filters.pageSize.toString(),
  }
  if (filters.sort) params.sort = filters.sort
  if (filters.searchTerm) params.q = filters.searchTerm
  return get(`/projects/${projectId}/tags/import`, {
    params,
    headers: { accept: "application/vnd.mirai.hateoas+json" },
  })
}

export function createTagImportJob(
  projectId: string,
  file: File
): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)
  return post(`/projects/${projectId}/tags/import`, formData)
}
