import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { getAvatarUrl } from "@/lib/get-avatar-url"
import { cn, getInitials } from "@/lib/utils"
import {
  WORK_ITEM_STATUS_COLORS,
  WORK_ITEM_TYPE_COLORS,
} from "@/lib/work-item-colors"
import type { BoardWorkItem, Card } from "@/types/boards"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card as UiCard } from "@/components/ui/card"

type BoardCardProps = {
  card: Card
  onOpen: (workItemId: string) => void
}

export function BoardCard({ card, onOpen }: BoardCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: { columnId: card.columnId } })

  const workItem = card.workItem

  return (
    <UiCard
      ref={setNodeRef}
      draggable={false}
      onDragStart={(event) => event.preventDefault()}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        touchAction: "none",
      }}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(workItem.id)}
      className={cn(
        "cursor-grab gap-2 p-3 text-sm active:cursor-grabbing",
        isDragging &&
          "border-2 border-dashed border-primary/40 bg-muted/40 shadow-none [&>*]:invisible"
      )}
    >
      <BoardCardBody workItem={workItem} />
    </UiCard>
  )
}

export function BoardCardOverlay({ workItem }: { workItem: BoardWorkItem }) {
  return (
    <UiCard className="w-72 rotate-2 cursor-grabbing gap-2 p-3 text-sm shadow-xl ring-2 ring-primary/20">
      <BoardCardBody workItem={workItem} />
    </UiCard>
  )
}

function BoardCardBody({ workItem }: { workItem: BoardWorkItem }) {
  return (
    <>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          #{workItem.code}
        </span>
        <Badge
          variant="outline"
          className={cn(
            "border-transparent",
            WORK_ITEM_TYPE_COLORS[workItem.type]
          )}
        >
          {workItem.type}
        </Badge>
      </div>
      <p className="line-clamp-2 font-medium">{workItem.title}</p>
      <div className="flex items-center justify-between">
        <Badge
          variant="outline"
          className={cn(
            "border-transparent",
            WORK_ITEM_STATUS_COLORS[workItem.status]
          )}
        >
          {workItem.status}
        </Badge>
        <div className="flex items-center gap-2">
          {workItem.storyPoints != null ? (
            <span className="text-xs text-muted-foreground">
              {workItem.storyPoints} pts
            </span>
          ) : null}
          {workItem.assignee ? (
            <Avatar className="size-6">
              <AvatarImage
                src={getAvatarUrl(workItem.assignee.imageUrl)}
                alt={workItem.assignee.name}
                draggable={false}
              />
              <AvatarFallback className="text-[0.6rem]">
                {getInitials(workItem.assignee.name)}
              </AvatarFallback>
            </Avatar>
          ) : null}
        </div>
      </div>
    </>
  )
}
