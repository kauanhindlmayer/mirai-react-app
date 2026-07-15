import { del, get, post, put } from "@/lib/api-client"
import type {
  CreateSprintRequest,
  Sprint,
  UpdateSprintRequest,
} from "@/types/sprints"

export function createSprint(
  teamId: string,
  request: CreateSprintRequest
): Promise<string> {
  return post(`/teams/${teamId}/sprints`, request)
}

export function listSprints(teamId: string): Promise<Sprint[]> {
  return get(`/teams/${teamId}/sprints`)
}

export function updateSprint(
  teamId: string,
  sprintId: string,
  request: UpdateSprintRequest
): Promise<void> {
  return put(`/teams/${teamId}/sprints/${sprintId}`, request)
}

export function deleteSprint(teamId: string, sprintId: string): Promise<void> {
  return del(`/teams/${teamId}/sprints/${sprintId}`)
}

export function addWorkItemToSprint(
  teamId: string,
  sprintId: string,
  workItemId: string
): Promise<void> {
  return post(`/teams/${teamId}/sprints/${sprintId}/work-items`, { workItemId })
}
