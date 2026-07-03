import { useParams } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { EllipsisVerticalIcon } from "lucide-react"

import { getDashboardData } from "@/api/dashboards"
import { BurndownChart } from "@/components/dashboards/burndown-chart"
import { BurnupChart } from "@/components/dashboards/burnup-chart"
import { ChartCard } from "@/components/dashboards/chart-card"
import { VelocityChart } from "@/components/dashboards/velocity-chart"
import { WorkItemScatterChart } from "@/components/dashboards/work-item-scatter-chart"
import { useCurrentTeam } from "@/hooks/use-current-team"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function formatDateRange(startDate: string, endDate: string): string {
  const format = (value: string) =>
    new Date(value).toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  return `${format(startDate)} – ${format(endDate)}`
}

export default function ProjectDashboardsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { team, teams, isLoadingTeams, selectTeam } = useCurrentTeam(projectId)

  const {
    data: dashboard,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["dashboard", team?.id],
    queryFn: () => getDashboardData(team!.id),
    enabled: !!team?.id,
    staleTime: 60_000,
  })

  const cycleTimePoints = (dashboard?.cycleTimeData ?? []).map((point) => ({
    x: new Date(point.completedDate).getTime(),
    y: point.cycleTimeDays,
    title: point.workItemTitle,
    type: point.workItemType,
  }))
  const leadTimePoints = (dashboard?.leadTimeData ?? []).map((point) => ({
    x: new Date(point.completedDate).getTime(),
    y: point.leadTimeDays,
    title: point.workItemTitle,
    type: point.workItemType,
  }))

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select
            value={team?.id}
            onValueChange={(value) => {
              const nextTeam = teams.find((t) => t.id === value)
              if (nextTeam) selectTeam(nextTeam)
            }}
          >
            <SelectTrigger className="w-56">
              <SelectValue
                placeholder={
                  isLoadingTeams ? "Loading teams…" : "Select a team"
                }
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
          {dashboard ? (
            <span className="text-xs text-muted-foreground">
              {formatDateRange(dashboard.startDate, dashboard.endDate)}
            </span>
          ) : null}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Dashboard options">
              <EllipsisVerticalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled>Dashboard Settings</DropdownMenuItem>
            <DropdownMenuItem disabled>Copy Dashboard</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard
          title="Burndown"
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
          isEmpty={dashboard?.burndownData.length === 0}
        >
          <BurndownChart data={dashboard?.burndownData ?? []} />
        </ChartCard>

        <ChartCard
          title="Burnup"
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
          isEmpty={dashboard?.burnupData.length === 0}
        >
          <BurnupChart data={dashboard?.burnupData ?? []} />
        </ChartCard>

        <ChartCard
          title="Cycle Time"
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
          isEmpty={cycleTimePoints.length === 0}
        >
          <WorkItemScatterChart points={cycleTimePoints} yLabel="Cycle time" />
        </ChartCard>

        <ChartCard
          title="Lead Time"
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
          isEmpty={leadTimePoints.length === 0}
        >
          <WorkItemScatterChart points={leadTimePoints} yLabel="Lead time" />
        </ChartCard>

        <ChartCard
          title="Velocity"
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
          isEmpty={dashboard?.velocityData.length === 0}
        >
          <VelocityChart data={dashboard?.velocityData ?? []} />
        </ChartCard>
      </div>
    </div>
  )
}
