import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  createTag,
  deleteTag,
  deleteTags,
  listTags,
  updateTag,
} from "@/api/tags"
import { createErrorToastHandler } from "@/lib/query-helpers"
import type { PaginationFilter } from "@/types/common"
import type { CreateTagRequest, UpdateTagRequest } from "@/types/tags"

export function tagsQueryKey(projectId: string) {
  return ["tags", projectId]
}

export function useTagsQuery(
  projectId: string,
  filters: PaginationFilter,
  options?: { enabled?: boolean; staleTime?: number }
) {
  return useQuery({
    queryKey: [...tagsQueryKey(projectId), filters],
    queryFn: () => listTags(projectId, filters),
    enabled: options?.enabled ?? !!projectId,
    staleTime: options?.staleTime ?? 30_000,
    placeholderData: (previous) => previous,
  })
}

export function useCreateTagMutation(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateTagRequest) => createTag(projectId, request),
    onError: createErrorToastHandler("Failed to create tag."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagsQueryKey(projectId) })
      toast.success("Tag created.")
    },
  })
}

export function useUpdateTagMutation(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      tagId,
      request,
    }: {
      tagId: string
      request: UpdateTagRequest
    }) => updateTag(projectId, tagId, request),
    onError: createErrorToastHandler("Failed to update tag."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagsQueryKey(projectId) })
    },
  })
}

export function useDeleteTagMutation(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (tagId: string) => deleteTag(projectId, tagId),
    onError: createErrorToastHandler("Failed to delete tag."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagsQueryKey(projectId) })
      toast.success("Tag deleted.")
    },
  })
}

export function useDeleteTagsMutation(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (tagIds: string[]) => deleteTags(projectId, tagIds),
    onError: createErrorToastHandler("Failed to delete tags."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagsQueryKey(projectId) })
      toast.success("Tags deleted.")
    },
  })
}
