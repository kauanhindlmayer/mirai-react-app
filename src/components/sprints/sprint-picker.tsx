import { SprintActionsMenu } from "@/components/sprints/sprint-actions-menu"
import { formatSprintDateRange } from "@/components/sprints/sprint-dates"
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
  onEdit: (sprint: Sprint) => void
  onDelete: (sprint: Sprint) => void
}

export function SprintPicker({
  sprints,
  selectedSprint,
  canManageSprints,
  onSelect,
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
        <SelectTrigger className="w-56">
          <SelectValue placeholder="No sprints yet" />
        </SelectTrigger>
        <SelectContent>
          {sprints.map((sprint) => (
            <SelectItem key={sprint.id} value={sprint.id}>
              {sprint.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedSprint ? (
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">
            {formatSprintDateRange(
              selectedSprint.startDate,
              selectedSprint.endDate
            )}
          </span>
          {canManageSprints ? (
            <SprintActionsMenu
              sprintName={selectedSprint.name}
              onEdit={() => onEdit(selectedSprint)}
              onDelete={() => onDelete(selectedSprint)}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
