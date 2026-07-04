import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { createTeam, getBacklog, listTeams } from "@/api/teams"
import { createErrorToastHandler } from "@/lib/query-helpers"
import type { BacklogLevel, CreateTeamRequest } from "@/types/teams"

export function teamsQueryKey(projectId: string) {
  return ["teams", projectId]
}

export function useTeamsQuery(projectId: string | undefined) {
  return useQuery({
    queryKey: teamsQueryKey(projectId ?? ""),
    queryFn: () => listTeams(projectId ?? ""),
    enabled: !!projectId,
    staleTime: 60_000,
    placeholderData: [],
  })
}

export function useCreateTeamMutation(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateTeamRequest) => createTeam(projectId, request),
    onError: createErrorToastHandler("Failed to create team."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamsQueryKey(projectId) })
      toast.success("Team created.")
    },
  })
}

export function backlogQueryKey(
  teamId: string,
  sprintId?: string,
  backlogLevel?: BacklogLevel
) {
  return ["backlog", teamId, sprintId, backlogLevel]
}

export function useBacklogQuery(
  teamId: string,
  sprintId?: string,
  backlogLevel?: BacklogLevel,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: backlogQueryKey(teamId, sprintId, backlogLevel),
    queryFn: () => getBacklog(teamId, sprintId, backlogLevel),
    enabled: options?.enabled ?? !!teamId,
    staleTime: 30_000,
    placeholderData: [],
  })
}
