import { useMemo, useState } from "react"
import { useParams, useSearchParams } from "react-router"

import { ErrorState } from "@/components/common/error-state"
import { type TreeNodeData } from "@/components/common/tree"
import { CreateSprintDialog } from "@/components/sprints/create-sprint-dialog"
import { DeleteSprintDialog } from "@/components/sprints/delete-sprint-dialog"
import { EditSprintDialog } from "@/components/sprints/edit-sprint-dialog"
import { SprintBacklogTree } from "@/components/sprints/sprint-backlog-tree"
import { SprintPicker } from "@/components/sprints/sprint-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useCan } from "@/hooks/use-can"
import { useCurrentTeam } from "@/hooks/use-current-team"
import { useSprintsQuery } from "@/queries/sprints"
import { useBacklogQuery } from "@/queries/teams"
import { Permission, RoleScope } from "@/types/roles"
import type { Sprint } from "@/types/sprints"
import { BacklogLevel, type BacklogResponse } from "@/types/teams"

function toTreeNodes(
  items: BacklogResponse[]
): TreeNodeData<BacklogResponse>[] {
  return items.map((item) => ({
    id: item.id,
    data: item,
    children: item.children.length > 0 ? toTreeNodes(item.children) : undefined,
  }))
}

export default function SprintsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [, setSearchParams] = useSearchParams()
  const { team, teams, isLoadingTeams, selectTeam } = useCurrentTeam(projectId)
  const canManageSprints = useCan(
    RoleScope.Team,
    team?.id,
    Permission.TeamManageSprints
  )
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [sprintUnderEdit, setSprintUnderEdit] = useState<Sprint | null>(null)
  const [sprintUnderDeletion, setSprintUnderDeletion] = useState<Sprint | null>(
    null
  )

  const sprintsQuery = useSprintsQuery(team?.id)

  const sprints = sprintsQuery.data ?? []
  const sprint =
    sprints.find((s) => s.id === selectedSprintId) ?? sprints[0] ?? null

  const backlogQuery = useBacklogQuery(
    team?.id ?? "",
    sprint?.id,
    BacklogLevel.UserStory,
    { enabled: !!team?.id && !!sprint?.id }
  )

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
        {team && canManageSprints ? (
          <CreateSprintDialog teamId={team.id} sprints={sprints} />
        ) : null}
      </div>

      <SprintPicker
        sprints={sprints}
        selectedSprint={sprint}
        canManageSprints={canManageSprints}
        onSelect={setSelectedSprintId}
        onEdit={setSprintUnderEdit}
        onDelete={setSprintUnderDeletion}
      />

      {team && sprintUnderEdit ? (
        <EditSprintDialog
          teamId={team.id}
          sprint={sprintUnderEdit}
          sprints={sprints}
          isOpen
          onOpenChange={() => setSprintUnderEdit(null)}
        />
      ) : null}

      {team && sprintUnderDeletion ? (
        <DeleteSprintDialog
          teamId={team.id}
          sprint={sprintUnderDeletion}
          isOpen
          onOpenChange={() => setSprintUnderDeletion(null)}
          onDeleted={() => setSelectedSprintId(null)}
        />
      ) : null}

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
          <SprintBacklogTree
            nodes={nodes}
            expandedIds={expandedIds}
            onToggle={toggle}
            onOpenWorkItem={openWorkItem}
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
