import { get, post } from "@/lib/api-client"
import type { CreateSprintRequest, Sprint } from "@/types/sprints"

export function createSprint(teamId: string, request: CreateSprintRequest): Promise<string> {
  return post(`/teams/${teamId}/sprints`, request)
}

export function listSprints(teamId: string): Promise<Sprint[]> {
  return get(`/teams/${teamId}/sprints`)
}

export function addWorkItemToSprint(
  teamId: string,
  sprintId: string,
  workItemId: string
): Promise<void> {
  return post(`/teams/${teamId}/sprints/${sprintId}/work-items`, { workItemId })
}
