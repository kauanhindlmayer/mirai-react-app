import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  addWorkItemToSprint,
  createSprint,
  deleteSprint,
  listSprints,
  updateSprint,
} from "@/api/sprints"
import { createErrorToastHandler } from "@/lib/query-helpers"
import { dashboardQueryKey } from "@/queries/dashboards"
import { teamBacklogsQueryKey } from "@/queries/teams"
import type { CreateSprintRequest, UpdateSprintRequest } from "@/types/sprints"

export function sprintsQueryKey(teamId: string | undefined) {
  return ["sprints", teamId]
}

export function useSprintsQuery(teamId: string | undefined) {
  return useQuery({
    queryKey: sprintsQueryKey(teamId),
    queryFn: () => listSprints(teamId!),
    enabled: !!teamId,
    staleTime: 60_000,
    placeholderData: [],
  })
}

export function useCreateSprintMutation(teamId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateSprintRequest) => createSprint(teamId, request),
    onError: createErrorToastHandler("Failed to create sprint."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sprintsQueryKey(teamId) })
      toast.success("Sprint created.")
    },
  })
}

export function useUpdateSprintMutation(teamId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      sprintId,
      request,
    }: {
      sprintId: string
      request: UpdateSprintRequest
    }) => updateSprint(teamId, sprintId, request),
    onError: createErrorToastHandler("Failed to update sprint."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sprintsQueryKey(teamId) })
      toast.success("Sprint updated.")
    },
  })
}

export function useDeleteSprintMutation(teamId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sprintId: string) => deleteSprint(teamId, sprintId),
    onError: createErrorToastHandler("Failed to delete sprint."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sprintsQueryKey(teamId) })
      queryClient.invalidateQueries({ queryKey: teamBacklogsQueryKey(teamId) })
      queryClient.invalidateQueries({ queryKey: dashboardQueryKey(teamId) })
      toast.success("Sprint deleted.")
    },
  })
}

export function useAddWorkItemToSprintMutation(
  teamId: string,
  sprintId: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (workItemId: string) =>
      addWorkItemToSprint(teamId, sprintId, workItemId),
    onError: createErrorToastHandler("Failed to add work item to sprint."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sprintsQueryKey(teamId) })
    },
  })
}
