import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  createRetrospective,
  createRetrospectiveItem,
  deleteRetrospective,
  deleteRetrospectiveItem,
  getRetrospective,
  listRetrospectives,
  updateRetrospective,
} from "@/api/retrospectives"
import { createErrorToastHandler } from "@/lib/query-helpers"
import type {
  CreateRetrospectiveRequest,
  UpdateRetrospectiveRequest,
} from "@/types/retrospectives"

export function retrospectivesQueryKey(teamId?: string) {
  return teamId ? ["retrospectives", teamId] : ["retrospectives"]
}

export function retrospectiveQueryKey(retrospectiveId: string | undefined) {
  return ["retrospective", retrospectiveId]
}

export function useRetrospectivesQuery(teamId: string | undefined) {
  return useQuery({
    queryKey: retrospectivesQueryKey(teamId),
    queryFn: () => listRetrospectives(teamId!),
    enabled: !!teamId,
    staleTime: 60_000,
    placeholderData: [],
  })
}

export function useRetrospectiveQuery(retrospectiveId: string | undefined) {
  return useQuery({
    queryKey: retrospectiveQueryKey(retrospectiveId),
    queryFn: () => getRetrospective(retrospectiveId!),
    enabled: !!retrospectiveId,
  })
}

export function useCreateRetrospectiveMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateRetrospectiveRequest) =>
      createRetrospective(request),
    onError: createErrorToastHandler("Failed to create retrospective."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: retrospectivesQueryKey() })
      toast.success("Retrospective created.")
    },
  })
}

export function useCreateRetrospectiveItemMutation(retrospectiveId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      columnId,
      content,
    }: {
      columnId: string
      content: string
    }) => createRetrospectiveItem(retrospectiveId, columnId, content),
    onError: createErrorToastHandler("Failed to add item."),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: retrospectiveQueryKey(retrospectiveId),
      })
    },
  })
}

export function useUpdateRetrospectiveMutation(retrospectiveId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: UpdateRetrospectiveRequest) =>
      updateRetrospective(retrospectiveId, request),
    onError: createErrorToastHandler("Failed to update retrospective."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: retrospectivesQueryKey() })
      queryClient.invalidateQueries({
        queryKey: retrospectiveQueryKey(retrospectiveId),
      })
      toast.success("Retrospective updated.")
    },
  })
}

export function useDeleteRetrospectiveItemMutation(retrospectiveId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ columnId, itemId }: { columnId: string; itemId: string }) =>
      deleteRetrospectiveItem(retrospectiveId, columnId, itemId),
    onError: createErrorToastHandler("Failed to delete item."),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: retrospectiveQueryKey(retrospectiveId),
      })
    },
  })
}

export function useDeleteRetrospectiveMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (retrospectiveId: string) =>
      deleteRetrospective(retrospectiveId),
    onError: createErrorToastHandler("Failed to delete retrospective."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: retrospectivesQueryKey() })
      toast.success("Retrospective deleted.")
    },
  })
}
