import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  addTagToWorkItem,
  addWorkItemComment,
  createWorkItemLink,
  deleteWorkItem,
  deleteWorkItemAttachment,
  deleteWorkItemComment,
  deleteWorkItemLink,
  getWorkItem,
  removeTagFromWorkItem,
  updateWorkItem,
  updateWorkItemComment,
  uploadWorkItemAttachment,
} from "@/api/work-items"
import type { AddCommentRequest, UpdateCommentRequest } from "@/types/common"
import type { CreateWorkItemLinkRequest, WorkItem } from "@/types/work-items"

export function workItemsQueryKey(projectId: string) {
  return ["work-items", projectId]
}

export function workItemQueryKey(projectId: string, workItemId: string) {
  return ["work-item", projectId, workItemId]
}

export function useWorkItem(projectId: string, workItemId: string | null) {
  return useQuery({
    queryKey: workItemQueryKey(projectId, workItemId ?? ""),
    queryFn: () => getWorkItem(projectId, workItemId!),
    enabled: !!workItemId,
  })
}

function createErrorToastHandler(message: string) {
  return (error: unknown) => {
    toast.error(message, {
      description:
        error instanceof Error ? error.message : "Something went wrong.",
    })
  }
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

export function useDeleteWorkItem(projectId: string) {
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

export function useUpdateWorkItem(projectId: string, workItemId: string) {
  const invalidate = useInvalidateWorkItem(projectId, workItemId)
  return useMutation({
    mutationFn: (request: Partial<WorkItem>) =>
      updateWorkItem(projectId, workItemId, request),
    onError: createErrorToastHandler("Failed to update work item."),
    onSuccess: invalidate,
  })
}

export function useAddWorkItemComment(projectId: string, workItemId: string) {
  const invalidate = useInvalidateWorkItem(projectId, workItemId)
  return useMutation({
    mutationFn: (request: AddCommentRequest) =>
      addWorkItemComment(projectId, workItemId, request),
    onError: createErrorToastHandler("Failed to add comment."),
    onSuccess: invalidate,
  })
}

export function useUpdateWorkItemComment(
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

export function useDeleteWorkItemComment(
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

export function useAddWorkItemTag(projectId: string, workItemId: string) {
  const invalidate = useInvalidateWorkItem(projectId, workItemId)
  return useMutation({
    mutationFn: (name: string) => addTagToWorkItem(projectId, workItemId, name),
    onError: createErrorToastHandler("Failed to add tag."),
    onSuccess: invalidate,
  })
}

export function useRemoveWorkItemTag(projectId: string, workItemId: string) {
  const invalidate = useInvalidateWorkItem(projectId, workItemId)
  return useMutation({
    mutationFn: (tagName: string) =>
      removeTagFromWorkItem(projectId, workItemId, tagName),
    onError: createErrorToastHandler("Failed to remove tag."),
    onSuccess: invalidate,
  })
}

export function useUploadWorkItemAttachment(
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

export function useDeleteWorkItemAttachment(
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

export function useCreateWorkItemLink(projectId: string, workItemId: string) {
  const invalidate = useInvalidateWorkItem(projectId, workItemId)
  return useMutation({
    mutationFn: (request: CreateWorkItemLinkRequest) =>
      createWorkItemLink(projectId, workItemId, request),
    onError: createErrorToastHandler("Failed to link work item."),
    onSuccess: invalidate,
  })
}

export function useDeleteWorkItemLink(projectId: string, workItemId: string) {
  const invalidate = useInvalidateWorkItem(projectId, workItemId)
  return useMutation({
    mutationFn: (linkId: string) =>
      deleteWorkItemLink(projectId, workItemId, linkId),
    onError: createErrorToastHandler("Failed to remove link."),
    onSuccess: invalidate,
  })
}
