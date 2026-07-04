import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  addWikiPageComment,
  createWikiPage,
  deleteWikiPage,
  deleteWikiPageComment,
  getWikiPage,
  getWikiPageStats,
  listWikiPages,
  moveWikiPage,
  updateWikiPage,
  updateWikiPageComment,
} from "@/api/wiki-pages"
import { createErrorToastHandler } from "@/lib/query-helpers"
import type { AddCommentRequest, UpdateCommentRequest } from "@/types/common"
import type {
  CreateWikiPageRequest,
  MoveWikiPageRequest,
  UpdateWikiPageRequest,
} from "@/types/wiki-pages"

export function wikiPagesQueryKey(projectId: string) {
  return ["wiki-pages", projectId]
}

export function wikiPageQueryKey(projectId: string, wikiPageId: string) {
  return ["wiki-page", projectId, wikiPageId]
}

export function useWikiPagesQuery(projectId: string | undefined) {
  return useQuery({
    queryKey: wikiPagesQueryKey(projectId ?? ""),
    queryFn: () => listWikiPages(projectId ?? ""),
    enabled: !!projectId,
    staleTime: 30_000,
    placeholderData: [],
  })
}

export function useWikiPageQuery(
  projectId: string | undefined,
  wikiPageId: string | undefined
) {
  return useQuery({
    queryKey: wikiPageQueryKey(projectId ?? "", wikiPageId ?? ""),
    queryFn: () => getWikiPage(projectId ?? "", wikiPageId ?? ""),
    enabled: !!projectId && !!wikiPageId,
  })
}

export function useWikiPageStatsQuery(
  projectId: string | undefined,
  wikiPageId: string | undefined
) {
  return useQuery({
    queryKey: ["wiki-page-stats", projectId ?? "", wikiPageId ?? ""],
    queryFn: () => getWikiPageStats(projectId ?? "", wikiPageId ?? ""),
    enabled: !!projectId && !!wikiPageId,
  })
}

function useInvalidateWikiPage(projectId: string, wikiPageId: string) {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({
      queryKey: wikiPageQueryKey(projectId, wikiPageId),
    })
  }
}

export function useCreateWikiPageMutation(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateWikiPageRequest) =>
      createWikiPage(projectId, request),
    onError: createErrorToastHandler("Failed to create wiki page."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wikiPagesQueryKey(projectId) })
      toast.success("Wiki page created.")
    },
  })
}

export function useUpdateWikiPageMutation(
  projectId: string,
  wikiPageId: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: UpdateWikiPageRequest) =>
      updateWikiPage(projectId, wikiPageId, request),
    onError: createErrorToastHandler("Failed to update wiki page."),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: wikiPageQueryKey(projectId, wikiPageId),
      })
      queryClient.invalidateQueries({ queryKey: wikiPagesQueryKey(projectId) })
      toast.success("Wiki page updated.")
    },
  })
}

export function useMoveWikiPageMutation(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      wikiPageId,
      request,
    }: {
      wikiPageId: string
      request: MoveWikiPageRequest
    }) => moveWikiPage(projectId, wikiPageId, request),
    onError: createErrorToastHandler("Failed to move page."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wikiPagesQueryKey(projectId) })
    },
  })
}

export function useDeleteWikiPageMutation(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (wikiPageId: string) => deleteWikiPage(projectId, wikiPageId),
    onError: createErrorToastHandler("Failed to delete wiki page."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wikiPagesQueryKey(projectId) })
      toast.success("Wiki page deleted.")
    },
  })
}

export function useAddWikiPageCommentMutation(
  projectId: string,
  wikiPageId: string
) {
  const invalidate = useInvalidateWikiPage(projectId, wikiPageId)
  return useMutation({
    mutationFn: (request: AddCommentRequest) =>
      addWikiPageComment(projectId, wikiPageId, request),
    onError: createErrorToastHandler("Failed to add comment."),
    onSuccess: invalidate,
  })
}

export function useUpdateWikiPageCommentMutation(
  projectId: string,
  wikiPageId: string
) {
  const invalidate = useInvalidateWikiPage(projectId, wikiPageId)
  return useMutation({
    mutationFn: ({
      commentId,
      request,
    }: {
      commentId: string
      request: UpdateCommentRequest
    }) => updateWikiPageComment(projectId, wikiPageId, commentId, request),
    onError: createErrorToastHandler("Failed to update comment."),
    onSuccess: invalidate,
  })
}

export function useDeleteWikiPageCommentMutation(
  projectId: string,
  wikiPageId: string
) {
  const invalidate = useInvalidateWikiPage(projectId, wikiPageId)
  return useMutation({
    mutationFn: (commentId: string) =>
      deleteWikiPageComment(projectId, wikiPageId, commentId),
    onError: createErrorToastHandler("Failed to delete comment."),
    onSuccess: invalidate,
  })
}
