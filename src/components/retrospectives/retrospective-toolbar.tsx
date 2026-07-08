import {
  EllipsisIcon,
  LinkIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { RetrospectiveSummary } from "@/types/retrospectives"
import type { Team } from "@/types/teams"

type RetrospectiveToolbarProps = {
  team: Team | null
  teams: Team[]
  isLoadingTeams: boolean
  onSelectTeam: (team: Team) => void
  retrospectives: RetrospectiveSummary[]
  selectedRetrospectiveId: string | undefined
  onSelectRetrospective: (retrospectiveId: string) => void
  onCreateRetrospective: () => void
  onEditRetrospective: () => void
  onDeleteRetrospective: () => void
}

export function RetrospectiveToolbar({
  team,
  teams,
  isLoadingTeams,
  onSelectTeam,
  retrospectives,
  selectedRetrospectiveId,
  onSelectRetrospective,
  onCreateRetrospective,
  onEditRetrospective,
  onDeleteRetrospective,
}: RetrospectiveToolbarProps) {
  function copyRetrospectiveLink() {
    navigator.clipboard.writeText(window.location.href)
    toast.success(
      "The link to the retrospective has been copied to the clipboard."
    )
  }

  return (
    <div className="flex items-center justify-between">
      <Select
        value={team?.id}
        onValueChange={(value) => {
          const nextTeam = teams.find((t) => t.id === value)
          if (nextTeam) onSelectTeam(nextTeam)
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

      {retrospectives.length > 0 ? (
        <div className="flex items-center gap-2">
          <Select
            value={selectedRetrospectiveId}
            onValueChange={onSelectRetrospective}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Select a retrospective" />
            </SelectTrigger>
            <SelectContent>
              {retrospectives.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Board actions">
                <EllipsisIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onCreateRetrospective}>
                <PlusIcon />
                Create New Retrospective
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onEditRetrospective}>
                <PencilIcon />
                Edit Retrospective
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={copyRetrospectiveLink}>
                <LinkIcon />
                Copy Retrospective Link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={onDeleteRetrospective}
              >
                <TrashIcon />
                Delete Retrospective
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : null}
    </div>
  )
}
