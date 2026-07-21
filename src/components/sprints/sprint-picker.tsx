import { SprintActionsMenu } from "@/components/sprints/sprint-actions-menu"
import { formatSprintDateRange } from "@/components/sprints/sprint-dates"
import { SprintStatusBadge } from "@/components/sprints/sprint-status-badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Sprint } from "@/types/sprints"

type SprintPickerProps = {
  sprints: Sprint[]
  selectedSprint: Sprint | null
  canManageSprints: boolean
  onSelect: (sprintId: string) => void
  onStart: (sprint: Sprint) => void
  onEdit: (sprint: Sprint) => void
  onDelete: (sprint: Sprint) => void
}

export function SprintPicker({
  sprints,
  selectedSprint,
  canManageSprints,
  onSelect,
  onStart,
  onEdit,
  onDelete,
}: SprintPickerProps) {
  return (
    <div className="flex items-center justify-between">
      <Select
        value={selectedSprint?.id}
        onValueChange={onSelect}
        disabled={sprints.length === 0}
      >
        <SelectTrigger className="w-64">
          <SelectValue placeholder="No sprints yet" />
        </SelectTrigger>
        <SelectContent>
          {sprints.map((sprint) => (
            <SelectItem key={sprint.id} value={sprint.id}>
              <span className="flex items-center gap-2">
                {sprint.name}
                <SprintStatusBadge status={sprint.status} />
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedSprint ? (
        <div className="flex items-center gap-2">
          <SprintStatusBadge status={selectedSprint.status} />
          <span className="text-xs text-muted-foreground">
            {formatSprintDateRange(
              selectedSprint.startDate,
              selectedSprint.endDate
            )}
          </span>
          {canManageSprints ? (
            <SprintActionsMenu
              sprintName={selectedSprint.name}
              status={selectedSprint.status}
              onStart={() => onStart(selectedSprint)}
              onEdit={() => onEdit(selectedSprint)}
              onDelete={() => onDelete(selectedSprint)}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
