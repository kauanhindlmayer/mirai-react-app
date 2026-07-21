import {
  MoreVerticalIcon,
  PencilIcon,
  PlayIcon,
  Trash2Icon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SprintStatus } from "@/types/sprints"

type SprintActionsMenuProps = {
  sprintName: string
  status: SprintStatus
  onStart: () => void
  onEdit: () => void
  onDelete: () => void
}

export function SprintActionsMenu({
  sprintName,
  status,
  onStart,
  onEdit,
  onDelete,
}: SprintActionsMenuProps) {
  const isPlanned = status === SprintStatus.Planned

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Sprint actions for ${sprintName}`}
        >
          <MoreVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isPlanned ? (
          <DropdownMenuItem onSelect={onStart}>
            <PlayIcon />
            Start
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onSelect={onEdit}>
          <PencilIcon />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <Trash2Icon />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
