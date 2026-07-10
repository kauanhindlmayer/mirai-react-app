import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  addUserToTeam,
  createTeam,
  getBacklog,
  getTeamMembers,
  listTeams,
  removeUserFromTeam,
} from "@/api/teams"
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

export function teamMembersQueryKey(projectId: string, teamId: string) {
  return ["team-members", projectId, teamId]
}

export function useTeamMembersQuery(
  projectId: string | undefined,
  teamId: string | undefined,
  page: number = 1,
  pageSize: number = 10
) {
  return useQuery({
    queryKey: [
      ...teamMembersQueryKey(projectId ?? "", teamId ?? ""),
      page,
      pageSize,
    ],
    queryFn: () =>
      getTeamMembers(projectId ?? "", teamId ?? "", page, pageSize),
    enabled: !!projectId && !!teamId,
    staleTime: 30_000,
    placeholderData: (previous) => previous,
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

export function useAddUserToTeamMutation(projectId: string, teamId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => addUserToTeam(projectId, teamId, userId),
    onError: createErrorToastHandler("Failed to add user to team."),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: teamMembersQueryKey(projectId, teamId),
      })
      queryClient.invalidateQueries({ queryKey: teamsQueryKey(projectId) })
      toast.success("User added to team.")
    },
  })
}

export function useRemoveUserFromTeamMutation(
  projectId: string,
  teamId: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) =>
      removeUserFromTeam(projectId, teamId, userId),
    onError: createErrorToastHandler("Failed to remove member."),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: teamMembersQueryKey(projectId, teamId),
      })
      queryClient.invalidateQueries({ queryKey: teamsQueryKey(projectId) })
      toast.success("Member removed.")
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
