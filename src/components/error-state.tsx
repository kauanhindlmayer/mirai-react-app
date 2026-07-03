import { RefreshCwIcon, TriangleAlertIcon } from "lucide-react"

import { cn, getErrorMessage } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type ErrorStateProps = {
  error?: unknown
  title?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  error,
  title = "Failed to load",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center",
        className
      )}
    >
      <TriangleAlertIcon className="size-10 text-destructive" />
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        {error ? getErrorMessage(error) : "Something went wrong."}
      </p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
          <RefreshCwIcon />
          Try again
        </Button>
      ) : null}
    </div>
  )
}
