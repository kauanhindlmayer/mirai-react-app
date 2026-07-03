import { del, get, post, put } from "@/lib/api-client"
import type { Retrospective, RetrospectiveSummary } from "@/types/retrospectives"

export function createRetrospective(retrospective: Partial<Retrospective>): Promise<string> {
  return post("/retrospectives", retrospective)
}

export function getRetrospective(retrospectiveId: string): Promise<Retrospective> {
  return get(`/retrospectives/${retrospectiveId}`)
}

export function listRetrospectives(teamId: string): Promise<RetrospectiveSummary[]> {
  return get(`/teams/${teamId}/retrospectives`)
}

export function createRetrospectiveItem(
  retrospectiveId: string,
  columnId: string,
  content: string
): Promise<string> {
  return post(`/retrospectives/${retrospectiveId}/columns/${columnId}/items`, { content })
}

export function updateRetrospective(
  retrospectiveId: string,
  retrospective: Partial<Retrospective>
): Promise<void> {
  return put(`/retrospectives/${retrospectiveId}`, retrospective)
}

export function deleteRetrospectiveItem(
  retrospectiveId: string,
  columnId: string,
  itemId: string
): Promise<void> {
  return del(`/retrospectives/${retrospectiveId}/columns/${columnId}/items/${itemId}`)
}

export function deleteRetrospective(retrospectiveId: string): Promise<void> {
  return del(`/retrospectives/${retrospectiveId}`)
}
