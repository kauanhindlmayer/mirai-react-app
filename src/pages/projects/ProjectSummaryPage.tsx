import { useState } from "react"

import { useProjectUsersQuery } from "@/queries/projects"
import { useWorkItemsStatsQuery } from "@/queries/work-items"
import { ErrorState } from "@/components/common/error-state"
import { useCurrentProject } from "@/hooks/use-current-project"
import { getAvatarUrl } from "@/lib/get-avatar-url"
import { getInitials } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

const PERIOD_OPTIONS = [
  { label: "Last 24 hours", value: 1 },
  { label: "Last 7 days", value: 7 },
  { label: "Last 30 days", value: 30 },
]

export default function ProjectSummaryPage() {
  const { projectId, project } = useCurrentProject()
  const [period, setPeriod] = useState(7)
  const [page, setPage] = useState(1)

  const statsQuery = useWorkItemsStatsQuery(projectId ?? "", period)

  const membersQuery = useProjectUsersQuery(
    project?.organizationId,
    projectId,
    undefined,
    page,
    10
  )

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            {project?.name ?? "Project"} — Summary
          </h1>
          <p className="text-sm text-muted-foreground">
            {project?.description}
          </p>
        </div>
        <Select
          value={period.toString()}
          onValueChange={(value) => setPeriod(Number(value))}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>Work items created</CardDescription>
            <CardTitle className="text-3xl">
              {statsQuery.isError ? (
                <span className="text-sm font-normal text-destructive">
                  Failed to load
                </span>
              ) : statsQuery.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                (statsQuery.data?.workItemsCreated ?? 0)
              )}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Work items completed</CardDescription>
            <CardTitle className="text-3xl">
              {statsQuery.isError ? (
                <span className="text-sm font-normal text-destructive">
                  Failed to load
                </span>
              ) : statsQuery.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                (statsQuery.data?.workItemsCompleted ?? 0)
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent members</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {membersQuery.isError ? (
            <ErrorState
              error={membersQuery.error}
              title="Failed to load members"
              onRetry={() => membersQuery.refetch()}
              className="py-4"
            />
          ) : membersQuery.data?.items.length ? (
            membersQuery.data.items.map((member) => (
              <div key={member.id} className="flex items-center gap-3">
                <Avatar className="size-8">
                  <AvatarImage src={getAvatarUrl(member.imageUrl)} alt={member.fullName} />
                  <AvatarFallback>
                    {getInitials(member.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{member.fullName}</span>
                  <span className="text-xs text-muted-foreground">
                    {member.email}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No members yet.</p>
          )}
        </CardContent>
        {membersQuery.data && membersQuery.data.totalPages > 1 ? (
          <CardFooter className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={!membersQuery.data.hasPreviousPage}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {membersQuery.data.page} of {membersQuery.data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!membersQuery.data.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </CardFooter>
        ) : null}
      </Card>
    </div>
  )
}
