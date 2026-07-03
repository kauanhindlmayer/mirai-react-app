import { del, get, post } from "@/lib/api-client"
import type {
  Board,
  BoardSummary,
  ColumnCardsResponse,
  CreateBoardColumnRequest,
  CreateBoardRequest,
  MoveCardRequest,
} from "@/types/boards"
import type { BacklogLevel } from "@/types/teams"

export function createBoard(teamId: string, request: CreateBoardRequest): Promise<string> {
  return post(`/teams/${teamId}/boards`, request)
}

export function getBoard(boardId: string, backlogLevel?: BacklogLevel): Promise<Board> {
  const params: Record<string, string> = {}
  if (backlogLevel) params.backlogLevel = backlogLevel
  return get(`/boards/${boardId}`, { params })
}

export function listBoards(projectId: string): Promise<BoardSummary[]> {
  return get(`/projects/${projectId}/boards`)
}

export function deleteBoard(boardId: string): Promise<void> {
  return del(`/boards/${boardId}`)
}

export function moveCard(
  boardId: string,
  columnId: string,
  cardId: string,
  request: MoveCardRequest
): Promise<void> {
  return post(`/boards/${boardId}/columns/${columnId}/cards/${cardId}/move`, request)
}

export function createColumn(boardId: string, request: CreateBoardColumnRequest): Promise<void> {
  return post(`/boards/${boardId}/columns`, request)
}

export function deleteColumn(boardId: string, columnId: string): Promise<void> {
  return del(`/boards/${boardId}/columns/${columnId}`)
}

export function getColumnCards(
  boardId: string,
  columnId: string,
  backlogLevel?: BacklogLevel,
  page: number = 1,
  pageSize: number = 20
): Promise<ColumnCardsResponse> {
  const params: Record<string, string> = {
    page: page.toString(),
    pageSize: pageSize.toString(),
  }
  if (backlogLevel) params.backlogLevel = backlogLevel
  return get(`/boards/${boardId}/columns/${columnId}/cards`, { params })
}
