import { useState } from "react"
import { useParams, useSearchParams } from "react-router"
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core"

import { BoardCardOverlay } from "@/components/boards/board-card"
import { BoardColumn } from "@/components/boards/board-column"
import { BoardSettingsSheet } from "@/components/boards/board-settings-sheet"
import { ErrorState } from "@/components/common/error-state"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useBoardQuery,
  useBoardsQuery,
  useMoveCardMutation,
} from "@/queries/boards"
import type { BoardWorkItem } from "@/types/boards"
import { BacklogLevel } from "@/types/teams"

export default function BoardsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [, setSearchParams] = useSearchParams()
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null)
  const [activeWorkItem, setActiveWorkItem] = useState<BoardWorkItem | null>(
    null
  )
  const [backlogLevel, setBacklogLevel] = useState<BacklogLevel>(
    BacklogLevel.UserStory
  )

  const boardsQuery = useBoardsQuery(projectId!)

  const boards = boardsQuery.data ?? []
  const activeBoardId =
    selectedBoardId && boards.some((board) => board.id === selectedBoardId)
      ? selectedBoardId
      : boards[0]?.id
  const activeBoard = boards.find((board) => board.id === activeBoardId)

  const boardQuery = useBoardQuery(activeBoardId, backlogLevel)

  const moveCardMutation = useMoveCardMutation(activeBoardId!)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function handleDragStart(event: DragStartEvent) {
    const allCards = boardQuery.data?.columns.flatMap((column) => column.cards)
    const card = allCards?.find((card) => card.id === event.active.id)
    setActiveWorkItem(card?.workItem ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveWorkItem(null)
    const { active, over } = event
    if (!over || !boardQuery.data) return

    const allCards = boardQuery.data.columns.flatMap((column) => column.cards)
    const activeCard = allCards.find((card) => card.id === active.id)
    if (!activeCard) return

    const overColumn = boardQuery.data.columns.find(
      (column) => column.id === over.id
    )
    const overCard = allCards.find((card) => card.id === over.id)
    const targetColumnId = overColumn?.id ?? overCard?.columnId
    if (!targetColumnId) return

    const targetColumn = boardQuery.data.columns.find(
      (column) => column.id === targetColumnId
    )
    if (!targetColumn) return

    const targetPosition = overCard
      ? targetColumn.cards.findIndex((card) => card.id === overCard.id)
      : targetColumn.cards.length

    if (
      targetColumnId === activeCard.columnId &&
      targetPosition === activeCard.position
    ) {
      return
    }

    moveCardMutation.mutate({
      columnId: activeCard.columnId,
      cardId: activeCard.id,
      request: { targetColumnId, targetPosition },
    })
  }

  function openWorkItem(workItemId: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set("workItemId", workItemId)
      return next
    })
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <Select value={activeBoardId} onValueChange={setSelectedBoardId}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Select a board" />
          </SelectTrigger>
          <SelectContent>
            {boards.map((board) => (
              <SelectItem key={board.id} value={board.id}>
                {board.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Select
            value={backlogLevel}
            onValueChange={(value) => setBacklogLevel(value as BacklogLevel)}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(BacklogLevel).map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeBoard ? (
            <BoardSettingsSheet
              boardId={activeBoard.id}
              columns={boardQuery.data?.columns ?? []}
            />
          ) : null}
        </div>
      </div>

      {boardsQuery.isError ? (
        <ErrorState
          error={boardsQuery.error}
          title="Failed to load boards"
          onRetry={() => boardsQuery.refetch()}
        />
      ) : boardQuery.isError ? (
        <ErrorState
          error={boardQuery.error}
          title="Failed to load board"
          onRetry={() => boardQuery.refetch()}
        />
      ) : boardQuery.data && activeBoard ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveWorkItem(null)}
        >
          <div className="flex flex-1 items-start gap-4 overflow-x-auto pb-2">
            {boardQuery.data.columns.map((column) => (
              <BoardColumn
                key={column.id}
                column={column}
                projectId={projectId!}
                teamId={activeBoard.teamId}
                boardId={activeBoard.id}
                onOpenWorkItem={openWorkItem}
              />
            ))}
          </div>
          <DragOverlay>
            {activeWorkItem ? (
              <BoardCardOverlay workItem={activeWorkItem} />
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <p className="text-sm text-muted-foreground">
          {boards.length === 0 ? "No boards yet." : "Loading…"}
        </p>
      )}
    </div>
  )
}
