import type { WorkItemStatus, WorkItemType } from "@/types/work-items"

export type Board = {
  id: string
  teamId: string
  name: string
  columns: Column[]
}

export type BoardSummary = {
  id: string
  teamId: string
  name: string
}

export type Column = {
  id: string
  name: string
  position: number
  isDefault: boolean
  wipLimit?: number
  definitionOfDone?: string
  cards: Card[]
  hasMoreCards: boolean
  totalCardCount: number
}

export type Card = {
  id: string
  columnId: string
  position: number
  workItem: BoardWorkItem
  createdAtUtc: string
  updatedAtUtc?: string
}

export type ColumnCardsResponse = {
  cards: Card[]
  hasMoreCards: boolean
  totalCardCount: number
}

export type BoardWorkItem = {
  id: string
  code: number
  title: string
  storyPoints?: number
  assignee?: Assignee
  type: WorkItemType
  status: WorkItemStatus
  tags: string[]
}

export type Assignee = {
  id: string
  name: string
  imageUrl?: string
}

export type MoveCardRequest = {
  targetColumnId: string
  targetPosition: number
}

export type CreateBoardColumnRequest = {
  name: string
  position: number
  wipLimit?: number
  definitionOfDone?: string
}
