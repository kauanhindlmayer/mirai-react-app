import { get, post } from "@/lib/api-client"
import type { BacklogLevel, BacklogResponse, CreateTeamRequest, Team } from "@/types/teams"

export function createTeam(projectId: string, request: CreateTeamRequest): Promise<string> {
  return post(`/projects/${projectId}/teams`, request)
}

export function listTeams(projectId: string): Promise<Team[]> {
  return get(`/projects/${projectId}/teams`)
}

export function getBacklog(
  teamId: string,
  sprintId?: string,
  backlogLevel?: BacklogLevel
): Promise<BacklogResponse[]> {
  const params: Record<string, string> = {}
  if (sprintId) params.sprintId = sprintId
  if (backlogLevel) params.backlogLevel = backlogLevel
  return get(`/teams/${teamId}/backlogs`, { params })
}
