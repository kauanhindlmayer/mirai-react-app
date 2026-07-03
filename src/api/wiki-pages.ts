import { del, get, post, put } from "@/lib/api-client"
import type { AddCommentRequest, UpdateCommentRequest } from "@/types/common"
import type {
  CreateWikiPageRequest,
  MoveWikiPageRequest,
  UpdateWikiPageRequest,
  WikiPage,
  WikiPageStats,
  WikiPageSummary,
} from "@/types/wiki-pages"

export function createWikiPage(
  projectId: string,
  request: CreateWikiPageRequest
): Promise<string> {
  return post(`/projects/${projectId}/wiki-pages`, request)
}

export function updateWikiPage(
  projectId: string,
  wikiPageId: string,
  request: UpdateWikiPageRequest
): Promise<void> {
  return put(`/projects/${projectId}/wiki-pages/${wikiPageId}`, request)
}

export function moveWikiPage(
  projectId: string,
  wikiPageId: string,
  request: MoveWikiPageRequest
): Promise<void> {
  return put(`/projects/${projectId}/wiki-pages/${wikiPageId}/move`, request)
}

export function getWikiPage(
  projectId: string,
  wikiPageId: string
): Promise<WikiPage> {
  return get(`/projects/${projectId}/wiki-pages/${wikiPageId}`)
}

export function getWikiPageStats(
  projectId: string,
  wikiPageId: string
): Promise<WikiPageStats> {
  return get(`/projects/${projectId}/wiki-pages/${wikiPageId}/stats`)
}

export function listWikiPages(projectId: string): Promise<WikiPageSummary[]> {
  return get(`/projects/${projectId}/wiki-pages`)
}

export function deleteWikiPage(
  projectId: string,
  wikiPageId: string
): Promise<void> {
  return del(`/projects/${projectId}/wiki-pages/${wikiPageId}`)
}

export function addWikiPageComment(
  projectId: string,
  wikiPageId: string,
  request: AddCommentRequest
): Promise<void> {
  return post(
    `/projects/${projectId}/wiki-pages/${wikiPageId}/comments`,
    request
  )
}

export function updateWikiPageComment(
  projectId: string,
  wikiPageId: string,
  commentId: string,
  request: UpdateCommentRequest
): Promise<void> {
  return put(
    `/projects/${projectId}/wiki-pages/${wikiPageId}/comments/${commentId}`,
    request
  )
}

export function deleteWikiPageComment(
  projectId: string,
  wikiPageId: string,
  commentId: string
): Promise<void> {
  return del(
    `/projects/${projectId}/wiki-pages/${wikiPageId}/comments/${commentId}`
  )
}
