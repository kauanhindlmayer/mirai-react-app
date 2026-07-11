import { ChevronRightIcon } from "lucide-react"
import { useState } from "react"

import { useWorkItemHistoryQuery } from "@/queries/work-items"
import { cn } from "@/lib/utils"
import { useWorkItemContext } from "@/components/work-items/work-item-context"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Spinner } from "@/components/ui/spinner"
import type { WorkItemChangeSet } from "@/types/work-items"

const DEFAULT_PAGE_SIZE = 10

export function WorkItemHistory() {
  const { projectId, workItemId } = useWorkItemContext()
  const [isExpanded, setIsExpanded] = useState(false)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const { data, isLoading } = useWorkItemHistoryQuery(projectId, workItemId, {
    pageSize,
    enabled: isExpanded,
  })

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto w-fit gap-1 p-0 text-xs text-muted-foreground hover:bg-transparent hover:text-foreground"
        >
          <ChevronRightIcon
            className={cn("size-3 transition-transform", isExpanded && "rotate-90")}
          />
          History
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-3 pt-3">
        {isLoading ? <Spinner className="size-4" /> : null}
        {data && data.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No changes yet.</p>
        ) : null}
        {data?.items.map((changeSet) => (
          <WorkItemChangeSetItem key={changeSet.id} changeSet={changeSet} />
        ))}
        {data?.hasNextPage ? (
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => setPageSize((prev) => prev + DEFAULT_PAGE_SIZE)}
          >
            Load more
          </Button>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  )
}

function WorkItemChangeSetItem({
  changeSet,
}: {
  changeSet: WorkItemChangeSet
}) {
  const actorName = changeSet.changedBy?.name ?? changeSet.systemActor ?? "Unknown"

  return (
    <div className="flex flex-col gap-1 border-l-2 pl-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{actorName}</span>
        <span>{new Date(changeSet.createdAtUtc).toLocaleString()}</span>
      </div>
      <ul className="flex flex-col gap-0.5 text-sm">
        {changeSet.changes.map((change) => (
          <li key={change.fieldName}>
            <span className="font-medium">{change.fieldName}</span>:{" "}
            <span className="text-muted-foreground">
              {change.oldValue ?? "—"}
            </span>{" "}
            → <span>{change.newValue ?? "—"}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
