import { useMemo, useState } from "react"
import { useParams, useSearchParams } from "react-router"
import { useQuery } from "@tanstack/react-query"

import { getBacklog } from "@/api/teams"
import { Tree, type TreeNodeData } from "@/components/common/tree"
import { ErrorState } from "@/components/error-state"
import { useDelayedLoading } from "@/hooks/use-delayed-loading"
import { useTeamContext } from "@/hooks/use-team-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  WORK_ITEM_STATUS_COLORS,
  WORK_ITEM_TYPE_COLORS,
} from "@/lib/work-item-colors"
import { BacklogLevel, type BacklogResponse } from "@/types/teams"
import type { WorkItemStatus, WorkItemType } from "@/types/work-items"

function toTreeNodes(
  items: BacklogResponse[]
): TreeNodeData<BacklogResponse>[] {
  return items.map((item) => ({
    id: item.id,
    data: item,
    children: item.children.length > 0 ? toTreeNodes(item.children) : undefined,
  }))
}

function collectIds(items: BacklogResponse[]): string[] {
  return items.flatMap((item) => [item.id, ...collectIds(item.children)])
}

export default function BacklogsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [, setSearchParams] = useSearchParams()
  const { team, teams, isLoadingTeams, selectTeam } = useTeamContext(projectId)
  const [backlogLevel, setBacklogLevel] = useState<BacklogLevel>(
    BacklogLevel.Feature
  )
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const backlogQuery = useQuery({
    queryKey: ["backlog", team?.id, backlogLevel],
    queryFn: () => getBacklog(team!.id, undefined, backlogLevel),
    enabled: !!team?.id,
    staleTime: 30_000,
    placeholderData: [],
  })

  const items = backlogQuery.data ?? []
  const nodes = useMemo(
    () => toTreeNodes(backlogQuery.data ?? []),
    [backlogQuery.data]
  )
  const showLoading = useDelayedLoading(backlogQuery.isLoading)

  function toggle(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function expandAll() {
    setExpandedIds(new Set(collectIds(items)))
  }

  function collapseAll() {
    setExpandedIds(new Set())
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
        <Select
          value={team?.id}
          onValueChange={(value) => {
            const nextTeam = teams.find((t) => t.id === value)
            if (nextTeam) selectTeam(nextTeam)
          }}
        >
          <SelectTrigger className="w-56">
            <SelectValue
              placeholder={isLoadingTeams ? "Loading teams…" : "Select a team"}
            />
          </SelectTrigger>
          <SelectContent>
            {teams.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            Expand all
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Collapse all
          </Button>
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
        </div>
      </div>

      <div className="rounded-md border p-2">
        {backlogQuery.isError ? (
          <ErrorState
            error={backlogQuery.error}
            title="Failed to load backlog"
            onRetry={() => backlogQuery.refetch()}
          />
        ) : showLoading ? (
          <div className="flex flex-col gap-2 p-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-6 w-full" />
            ))}
          </div>
        ) : nodes.length > 0 ? (
          <Tree
            nodes={nodes}
            expandedIds={expandedIds}
            onToggle={toggle}
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
                  onClick={() => openWorkItem(node.data.id)}
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
                <span className="w-24 shrink-0 truncate text-xs text-muted-foreground">
                  {node.data.valueArea}
                </span>
              </div>
            )}
          />
        ) : (
          <p className="p-4 text-sm text-muted-foreground">
            {team
              ? "No work items in this backlog."
              : "Select a team to view its backlog."}
          </p>
        )}
      </div>
    </div>
  )
}
