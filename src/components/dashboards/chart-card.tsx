import type { ReactNode } from "react"

import { ErrorState } from "@/components/error-state"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type ChartCardProps = {
  title: string
  isLoading: boolean
  isError?: boolean
  error?: unknown
  onRetry?: () => void
  isEmpty?: boolean
  children: ReactNode
}

export function ChartCard({
  title,
  isLoading,
  isError,
  error,
  onRetry,
  isEmpty,
  children,
}: ChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isError ? (
          <ErrorState
            error={error}
            title="Failed to load chart"
            onRetry={onRetry}
            className="h-64 py-0"
          />
        ) : isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : isEmpty ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No data for this period.
          </div>
        ) : (
          <div className="h-64 w-full">{children}</div>
        )}
      </CardContent>
    </Card>
  )
}
