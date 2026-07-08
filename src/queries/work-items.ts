import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  addTagToWorkItem,
  addWorkItemComment,
  createWorkItem,
  createWorkItemLink,
  deleteWorkItem,
  deleteWorkItemAttachment,
  deleteWorkItemComment,
  deleteWorkItemLink,
  getWorkItem,
  getWorkItemsStats,
  linkPullRequestToWorkItem,
  listWorkItems,
  removePullRequestLink,
  removeTagFromWorkItem,
  updateWorkItem,
  updateWorkItemComment,
  uploadWorkItemAttachment,
} from "@/api/work-items"
import { createErrorToastHandler } from "@/lib/query-helpers"
import type {
  AddCommentRequest,
  PaginationFilter,
  UpdateCommentRequest,
} from "@/types/common"
import type {
  CreateWorkItemLinkRequest,
  CreateWorkItemRequest,
  LinkPullRequestRequest,
  WorkItem,
} from "@/types/work-items"

export function workItemsQueryKey(projectId: string) {
  return ["work-items", projectId]
}

export function workItemQueryKey(projectId: string, workItemId: string) {
  return ["work-item", projectId, workItemId]
}

export function useWorkItemQuery(projectId: string, workItemId: string | null) {
  return useQuery({
    queryKey: workItemQueryKey(projectId, workItemId ?? ""),
    queryFn: () => getWorkItem(projectId, workItemId!),
    enabled: !!workItemId,
  })
}

export function useWorkItemsQuery(
  projectId: string,
  filters: PaginationFilter
) {
  return useQuery({
    queryKey: [...workItemsQueryKey(projectId), filters],
    queryFn: () => listWorkItems(projectId, filters),
    enabled: !!projectId,
    staleTime: 60_000,
    placeholderData: (previous) => previous,
  })
}

export function useWorkItemsSearchQuery(
  projectId: string,
  search: string,
  options: { pageSize: number; enabled: boolean }
) {
  return useQuery({
    queryKey: [
      ...workItemsQueryKey(projectId),
      "search",
      search,
      options.pageSize,
    ],
    queryFn: () =>
      listWorkItems(projectId, {
        page: 1,
        pageSize: options.pageSize,
        sort: "",
        searchTerm: search,
      }),
    enabled: options.enabled,
    staleTime: 30_000,
  })
}

export function useWorkItemsStatsQuery(
  projectId: string,
  periodInDays: number
) {
  return useQuery({
    queryKey: ["work-items-stats", projectId, periodInDays],
    queryFn: () => getWorkItemsStats(projectId, periodInDays),
    enabled: !!projectId,
    staleTime: 60_000,
  })
}

function useInvalidateWorkItem(projectId: string, workItemId: string) {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({
      queryKey: workItemQueryKey(projectId, workItemId),
    })
    queryClient.invalidateQueries({ queryKey: workItemsQueryKey(projectId) })
  }
}

export function useCreateWorkItemMutation(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateWorkItemRequest) =>
      createWorkItem(projectId, request),
    onError: createErrorToastHandler("Failed to create work item."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workItemsQueryKey(projectId) })
    },
  })
}

export function useDeleteWorkItemMutation(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (workItemId: string) => deleteWorkItem(projectId, workItemId),
    onError: createErrorToastHandler("Failed to delete work item."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workItemsQueryKey(projectId) })
      toast.success("Work item deleted.")
    },
  })
}

export function useUpdateWorkItemMutation(
  projectId: string,
  workItemId: string
) {
  const invalidate = useInvalidateWorkItem(projectId, workItemId)
  return useMutation({
    mutationFn: (request: Partial<WorkItem>) =>
      updateWorkItem(projectId, workItemId, request),
    onError: createErrorToastHandler("Failed to update work item."),
    onSuccess: invalidate,
  })
}

export function useAddWorkItemCommentMutation(
  projectId: string,
  workItemId: string
) {
  const invalidate = useInvalidateWorkItem(projectId, workItemId)
  return useMutation({
    mutationFn: (request: AddCommentRequest) =>
      addWorkItemComment(projectId, workItemId, request),
    onError: createErrorToastHandler("Failed to add comment."),
    onSuccess: invalidate,
  })
}

export function useUpdateWorkItemCommentMutation(
  projectId: string,
  workItemId: string
) {
  const invalidate = useInvalidateWorkItem(projectId, workItemId)
  return useMutation({
    mutationFn: ({
      commentId,
      request,
    }: {
      commentId: string
      request: UpdateCommentRequest
    }) => updateWorkItemComment(projectId, workItemId, commentId, request),
    onError: createErrorToastHandler("Failed to update comment."),
    onSuccess: invalidate,
  })
}

export function useDeleteWorkItemCommentMutation(
  projectId: string,
  workItemId: string
) {
  const invalidate = useInvalidateWorkItem(projectId, workItemId)
  return useMutation({
    mutationFn: (commentId: string) =>
      deleteWorkItemComment(projectId, workItemId, commentId),
    onError: createErrorToastHandler("Failed to delete comment."),
    onSuccess: invalidate,
  })
}

export function useAddWorkItemTagMutation(
  projectId: string,
  workItemId: string
) {
  const invalidate = useInvalidateWorkItem(projectId, workItemId)
  return useMutation({
    mutationFn: (name: string) => addTagToWorkItem(projectId, workItemId, name),
    onError: createErrorToastHandler("Failed to add tag."),
    onSuccess: invalidate,
  })
}

export function useRemoveWorkItemTagMutation(
  projectId: string,
  workItemId: string
) {
  const invalidate = useInvalidateWorkItem(projectId, workItemId)
  return useMutation({
    mutationFn: (tagName: string) =>
      removeTagFromWorkItem(projectId, workItemId, tagName),
    onError: createErrorToastHandler("Failed to remove tag."),
    onSuccess: invalidate,
  })
}

export function useUploadWorkItemAttachmentMutation(
  projectId: string,
  workItemId: string
) {
  const invalidate = useInvalidateWorkItem(projectId, workItemId)
  return useMutation({
    mutationFn: (file: File) =>
      uploadWorkItemAttachment(projectId, workItemId, file),
    onError: createErrorToastHandler("Failed to upload attachment."),
    onSuccess: invalidate,
  })
}

export function useDeleteWorkItemAttachmentMutation(
  projectId: string,
  workItemId: string
) {
  const invalidate = useInvalidateWorkItem(projectId, workItemId)
  return useMutation({
    mutationFn: (attachmentId: string) =>
      deleteWorkItemAttachment(projectId, workItemId, attachmentId),
    onError: createErrorToastHandler("Failed to delete attachment."),
    onSuccess: invalidate,
  })
}

export function useCreateWorkItemLinkMutation(
  projectId: string,
  workItemId: string
) {
  const invalidate = useInvalidateWorkItem(projectId, workItemId)
  return useMutation({
    mutationFn: (request: CreateWorkItemLinkRequest) =>
      createWorkItemLink(projectId, workItemId, request),
    onError: createErrorToastHandler("Failed to link work item."),
    onSuccess: invalidate,
  })
}

export function useDeleteWorkItemLinkMutation(
  projectId: string,
  workItemId: string
) {
  const invalidate = useInvalidateWorkItem(projectId, workItemId)
  return useMutation({
    mutationFn: (linkId: string) =>
      deleteWorkItemLink(projectId, workItemId, linkId),
    onError: createErrorToastHandler("Failed to remove link."),
    onSuccess: invalidate,
  })
}

export function useLinkPullRequestToWorkItemMutation(
  projectId: string,
  workItemId: string
) {
  const invalidate = useInvalidateWorkItem(projectId, workItemId)
  return useMutation({
    mutationFn: (request: LinkPullRequestRequest) =>
      linkPullRequestToWorkItem(projectId, workItemId, request),
    onError: createErrorToastHandler("Failed to link pull request."),
    onSuccess: invalidate,
  })
}

export function useRemovePullRequestLinkMutation(
  projectId: string,
  workItemId: string
) {
  const invalidate = useInvalidateWorkItem(projectId, workItemId)
  return useMutation({
    mutationFn: (linkId: string) =>
      removePullRequestLink(projectId, workItemId, linkId),
    onError: createErrorToastHandler("Failed to remove pull request link."),
    onSuccess: invalidate,
  })
}
