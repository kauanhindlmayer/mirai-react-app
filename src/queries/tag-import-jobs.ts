import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { createTagImportJob, listTagImportJobs } from "@/api/tag-import-jobs"
import { createErrorToastHandler } from "@/lib/query-helpers"
import type { PaginationFilter } from "@/types/common"

export function tagImportJobsQueryKey(projectId: string) {
  return ["tag-import-jobs", projectId]
}

export function useTagImportJobsQuery(
  projectId: string,
  filters: PaginationFilter
) {
  return useQuery({
    queryKey: [...tagImportJobsQueryKey(projectId), filters],
    queryFn: () => listTagImportJobs(projectId, filters),
    enabled: !!projectId,
    staleTime: 15_000,
    placeholderData: (previous) => previous,
  })
}

export function useCreateTagImportJobMutation(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => createTagImportJob(projectId, file),
    onError: createErrorToastHandler("Failed to start import."),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: tagImportJobsQueryKey(projectId),
      })
      toast.success("Import started.")
    },
  })
}
