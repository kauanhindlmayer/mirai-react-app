import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { SprintStatus } from "@/types/sprints"

type BadgedStatus = Exclude<SprintStatus, typeof SprintStatus.Planned>

const SPRINT_STATUS_STYLES: Record<BadgedStatus, string> = {
  [SprintStatus.Active]:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  [SprintStatus.Completed]: "bg-muted text-muted-foreground line-through",
}

type SprintStatusBadgeProps = {
  status: SprintStatus
  className?: string
}

/** Planned needs no badge - it is the unremarkable default. */
export function SprintStatusBadge({
  status,
  className,
}: SprintStatusBadgeProps) {
  if (status === SprintStatus.Planned) return null

  return (
    <Badge
      variant="outline"
      className={cn(
        "shrink-0 border-transparent",
        SPRINT_STATUS_STYLES[status],
        className
      )}
    >
      {status}
    </Badge>
  )
}
