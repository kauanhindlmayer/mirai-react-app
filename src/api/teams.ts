import { get, post } from "@/lib/api-client"
import type { PaginatedList } from "@/types/common"
import type {
  BacklogLevel,
  BacklogResponse,
  CreateTeamRequest,
  Team,
  TeamMember,
} from "@/types/teams"

export function createTeam(
  projectId: string,
  request: CreateTeamRequest
): Promise<string> {
  return post(`/projects/${projectId}/teams`, request)
}

export function listTeams(projectId: string): Promise<Team[]> {
  return get(`/projects/${projectId}/teams`)
}

export function getTeamMembers(
  projectId: string,
  teamId: string,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedList<TeamMember>> {
  return get(`/projects/${projectId}/teams/${teamId}/members`, {
    params: { page: page.toString(), pageSize: pageSize.toString() },
  })
}

export function addUserToTeam(
  projectId: string,
  teamId: string,
  userId: string
): Promise<void> {
  return post(`/projects/${projectId}/teams/${teamId}/members`, { userId })
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
