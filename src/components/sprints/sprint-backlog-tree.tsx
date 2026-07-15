import { Tree, type TreeNodeData } from "@/components/common/tree"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  WORK_ITEM_STATUS_COLORS,
  WORK_ITEM_TYPE_COLORS,
} from "@/lib/work-item-colors"
import type { BacklogResponse } from "@/types/teams"
import type { WorkItemStatus, WorkItemType } from "@/types/work-items"

type SprintBacklogTreeProps = {
  nodes: TreeNodeData<BacklogResponse>[]
  expandedIds: Set<string>
  onToggle: (id: string) => void
  onOpenWorkItem: (workItemId: string) => void
}

export function SprintBacklogTree({
  nodes,
  expandedIds,
  onToggle,
  onOpenWorkItem,
}: SprintBacklogTreeProps) {
  return (
    <Tree
      nodes={nodes}
      expandedIds={expandedIds}
      onToggle={onToggle}
      renderLabel={(node) => (
        <div className="flex flex-1 items-center gap-2 py-0.5 text-sm">
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 border-transparent",
              WORK_ITEM_TYPE_COLORS[node.data.type as WorkItemType]
            )}
          >
            {node.data.type}
          </Badge>
          <button
            type="button"
            className="flex-1 truncate text-left hover:underline"
            onClick={() => onOpenWorkItem(node.data.id)}
          >
            #{node.data.code} {node.data.title}
          </button>
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 border-transparent",
              WORK_ITEM_STATUS_COLORS[node.data.status as WorkItemStatus]
            )}
          >
            {node.data.status}
          </Badge>
          {node.data.storyPoints != null ? (
            <span className="w-8 shrink-0 text-right text-xs text-muted-foreground">
              {node.data.storyPoints}
            </span>
          ) : null}
        </div>
      )}
    />
  )
}
