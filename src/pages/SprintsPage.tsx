import { useMemo, useState } from "react"
import { useParams, useSearchParams } from "react-router"
import { useQuery } from "@tanstack/react-query"

import { getBacklog } from "@/api/teams"
import { listSprints } from "@/api/sprints"
import { Tree, type TreeNodeData } from "@/components/common/tree"
import { CreateSprintDialog } from "@/components/sprints/create-sprint-dialog"
import { ErrorState } from "@/components/error-state"
import { useCurrentTeam } from "@/hooks/use-current-team"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

function formatDateRange(startDate: string, endDate: string): string {
  const format = (value: string) =>
    new Date(value).toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
    })
  return `${format(startDate)} – ${format(endDate)}`
}

export default function SprintsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [, setSearchParams] = useSearchParams()
  const { team, teams, isLoadingTeams, selectTeam } = useCurrentTeam(projectId)
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const sprintsQuery = useQuery({
    queryKey: ["sprints", team?.id],
    queryFn: () => listSprints(team!.id),
    enabled: !!team?.id,
    staleTime: 60_000,
    placeholderData: [],
  })

  const sprints = sprintsQuery.data ?? []
  const sprint =
    sprints.find((s) => s.id === selectedSprintId) ?? sprints[0] ?? null

  const backlogQuery = useQuery({
    queryKey: ["backlog", team?.id, sprint?.id, BacklogLevel.UserStory],
    queryFn: () => getBacklog(team!.id, sprint!.id, BacklogLevel.UserStory),
    enabled: !!team?.id && !!sprint?.id,
    staleTime: 30_000,
    placeholderData: [],
  })

  const nodes = useMemo(
    () => toTreeNodes(backlogQuery.data ?? []),
    [backlogQuery.data]
  )

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
        {team ? <CreateSprintDialog teamId={team.id} /> : null}
      </div>

      <div className="flex items-center justify-between">
        <Select
          value={sprint?.id}
          onValueChange={setSelectedSprintId}
          disabled={sprints.length === 0}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="No sprints yet" />
          </SelectTrigger>
          <SelectContent>
            {sprints.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {sprint ? (
          <span className="text-xs text-muted-foreground">
            {formatDateRange(sprint.startDate, sprint.endDate)}
          </span>
        ) : null}
      </div>

      <div className="rounded-md border p-2">
        {sprintsQuery.isError ? (
          <ErrorState
            error={sprintsQuery.error}
            title="Failed to load sprints"
            onRetry={() => sprintsQuery.refetch()}
          />
        ) : backlogQuery.isError ? (
          <ErrorState
            error={backlogQuery.error}
            title="Failed to load sprint backlog"
            onRetry={() => backlogQuery.refetch()}
          />
        ) : backlogQuery.isLoading ? (
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
              </div>
            )}
          />
        ) : (
          <p className="p-4 text-sm text-muted-foreground">
            {sprint
              ? "No work items in this sprint."
              : "Select or create a sprint to view its backlog."}
          </p>
        )}
      </div>
    </div>
  )
}
