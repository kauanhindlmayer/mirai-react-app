import { useState } from "react"

import { useTeamsQuery } from "@/queries/teams"
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
export function useCurrentTeam(projectId: string | undefined) {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(() =>
    getStoredTeamId()
  )

  const { data: teams = [], isLoading } = useTeamsQuery(projectId)

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
