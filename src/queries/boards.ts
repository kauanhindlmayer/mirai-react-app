import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  createColumn,
  deleteBoard,
  deleteColumn,
  getBoard,
  listBoards,
  moveCard,
} from "@/api/boards"
import { createErrorToastHandler } from "@/lib/query-helpers"
import type { CreateBoardColumnRequest, MoveCardRequest } from "@/types/boards"
import type { BacklogLevel } from "@/types/teams"

export function boardsQueryKey(projectId?: string) {
  return projectId ? ["boards", projectId] : ["boards"]
}

export function useBoardsQuery(projectId: string) {
  return useQuery({
    queryKey: boardsQueryKey(projectId),
    queryFn: () => listBoards(projectId),
    enabled: !!projectId,
    staleTime: 60_000,
    placeholderData: [],
  })
}

export function boardQueryKey(boardId: string, backlogLevel?: BacklogLevel) {
  return ["board", boardId, backlogLevel]
}

export function useBoardQuery(
  boardId: string | undefined,
  backlogLevel?: BacklogLevel
) {
  return useQuery({
    queryKey: boardQueryKey(boardId ?? "", backlogLevel),
    queryFn: () => getBoard(boardId ?? "", backlogLevel),
    enabled: !!boardId,
    staleTime: 30_000,
  })
}

function useInvalidateBoard(boardId: string) {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: boardQueryKey(boardId) })
  }
}

export function useCreateColumnMutation(boardId: string) {
  const invalidate = useInvalidateBoard(boardId)
  return useMutation({
    mutationFn: (request: CreateBoardColumnRequest) =>
      createColumn(boardId, request),
    onError: createErrorToastHandler("Failed to create column."),
    onSuccess: () => {
      invalidate()
      toast.success("Column created.")
    },
  })
}

export function useDeleteColumnMutation(boardId: string) {
  const invalidate = useInvalidateBoard(boardId)
  return useMutation({
    mutationFn: (columnId: string) => deleteColumn(boardId, columnId),
    onError: createErrorToastHandler("Failed to delete column."),
    onSuccess: () => {
      invalidate()
      toast.success("Column deleted.")
    },
  })
}

export function useMoveCardMutation(boardId: string) {
  const invalidate = useInvalidateBoard(boardId)
  return useMutation({
    mutationFn: ({
      columnId,
      cardId,
      request,
    }: {
      columnId: string
      cardId: string
      request: MoveCardRequest
    }) => moveCard(boardId, columnId, cardId, request),
    onError: (error) => {
      createErrorToastHandler("Failed to move card.")(error)
      invalidate()
    },
    onSuccess: invalidate,
  })
}

export function useDeleteBoardMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (boardId: string) => deleteBoard(boardId),
    onError: createErrorToastHandler("Failed to delete board."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardsQueryKey() })
      toast.success("Board deleted.")
    },
  })
}
