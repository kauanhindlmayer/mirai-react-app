import { useState } from "react"

import { useTeamsQuery } from "@/queries/teams"
import { CreateTeamDialog } from "@/components/projects/create-team-dialog"
import { TeamMembersDialog } from "@/components/projects/team-members-dialog"
import { ErrorState } from "@/components/common/error-state"
import type { Team } from "@/types/teams"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

type ProjectTeamsTabProps = {
  organizationId: string
  projectId: string
}

export function ProjectTeamsTab({
  organizationId,
  projectId,
}: ProjectTeamsTabProps) {
  const {
    data: teams = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useTeamsQuery(projectId)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Teams</h2>
        <CreateTeamDialog projectId={projectId} />
      </div>
      {isError ? (
        <ErrorState
          error={error}
          title="Failed to load teams"
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : teams.length > 0 ? (
        <ul className="flex flex-col divide-y rounded-md border">
          {teams.map((team) => (
            <li key={team.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-muted"
                onClick={() => setSelectedTeam(team)}
              >
                <span>{team.name}</span>
                <Badge variant="outline">
                  {team.memberCount}{" "}
                  {team.memberCount === 1 ? "member" : "members"}
                </Badge>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No teams yet.</p>
      )}
      {selectedTeam ? (
        <TeamMembersDialog
          organizationId={organizationId}
          projectId={projectId}
          team={selectedTeam}
          open={!!selectedTeam}
          onOpenChange={(open) => {
            if (!open) setSelectedTeam(null)
          }}
        />
      ) : null}
    </div>
  )
}
