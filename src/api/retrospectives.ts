import { del, get, post, put } from "@/lib/api-client"
import type {
  CreateRetrospectiveRequest,
  Retrospective,
  RetrospectiveSummary,
  UpdateRetrospectiveRequest,
} from "@/types/retrospectives"

export function createRetrospective(
  request: CreateRetrospectiveRequest
): Promise<string> {
  return post("/retrospectives", request)
}

export function getRetrospective(
  retrospectiveId: string
): Promise<Retrospective> {
  return get(`/retrospectives/${retrospectiveId}`)
}

export function listRetrospectives(
  teamId: string
): Promise<RetrospectiveSummary[]> {
  return get(`/teams/${teamId}/retrospectives`)
}

export function createRetrospectiveItem(
  retrospectiveId: string,
  columnId: string,
  content: string
): Promise<string> {
  return post(`/retrospectives/${retrospectiveId}/columns/${columnId}/items`, {
    content,
  })
}

export function updateRetrospective(
  retrospectiveId: string,
  request: UpdateRetrospectiveRequest
): Promise<void> {
  return put(`/retrospectives/${retrospectiveId}`, request)
}

export function deleteRetrospectiveItem(
  retrospectiveId: string,
  columnId: string,
  itemId: string
): Promise<void> {
  return del(
    `/retrospectives/${retrospectiveId}/columns/${columnId}/items/${itemId}`
  )
}

export function deleteRetrospective(retrospectiveId: string): Promise<void> {
  return del(`/retrospectives/${retrospectiveId}`)
}
