import { useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { listTeams } from "@/api/teams"
import type { Team } from "@/types/teams"

const TEAM_ID_STORAGE_KEY = "teamId"

function getStoredTeamId(): string | null {
  return localStorage.getItem(TEAM_ID_STORAGE_KEY)
}

function setStoredTeamId(teamId: string): void {
  localStorage.setItem(TEAM_ID_STORAGE_KEY, teamId)
}

/**
 * Mirrors the Vue `team-context`/`useTeamSelection` composables: persists the
 * last-selected team id, but falls back to the first team of the current
 * project whenever the persisted id doesn't belong to it (derived on every
 * render rather than synced via an effect).
 */
export function useTeamContext(projectId: string | undefined) {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(() =>
    getStoredTeamId()
  )

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ["teams", projectId],
    queryFn: () => listTeams(projectId!),
    enabled: !!projectId,
    staleTime: 60_000,
    placeholderData: [],
  })

  const currentTeamExists = teams.some((team) => team.id === selectedTeamId)
  const team: Team | null =
    (currentTeamExists
      ? teams.find((t) => t.id === selectedTeamId)
      : teams[0]) ?? null

  function selectTeam(nextTeam: Team) {
    setSelectedTeamId(nextTeam.id)
    setStoredTeamId(nextTeam.id)
  }

  return {
    team,
    teamId: team?.id,
    teams,
    isLoadingTeams: isLoading,
    selectTeam,
  }
}
