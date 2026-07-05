import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { act, waitFor } from "@testing-library/react"

import { useCurrentTeam } from "@/hooks/use-current-team"
import { server } from "@/test/mocks/server"
import { renderHookWithProviders } from "@/test/test-utils"
import type { Team } from "@/types/teams"

function buildTeam(overrides: Partial<Team> = {}): Team {
  return {
    id: "team-1",
    name: "Team Alpha",
    boardId: "board-1",
    isDefault: true,
    memberCount: 3,
    ...overrides,
  }
}

function mockTeams(teams: Team[]) {
  server.use(
    http.get("*/api/projects/project-1/teams", () => HttpResponse.json(teams))
  )
}

beforeEach(() => {
  localStorage.clear()
})

describe("useCurrentTeam", () => {
  it("falls back to the project's first team when nothing is persisted", async () => {
    mockTeams([
      buildTeam(),
      buildTeam({ id: "team-2", name: "Team Beta", isDefault: false }),
    ])

    const { result } = renderHookWithProviders(() =>
      useCurrentTeam("project-1")
    )

    await waitFor(() => expect(result.current.team?.id).toBe("team-1"))
  })

  it("uses the persisted team id when it belongs to the project", async () => {
    localStorage.setItem("teamId", "team-2")
    mockTeams([
      buildTeam(),
      buildTeam({ id: "team-2", name: "Team Beta", isDefault: false }),
    ])

    const { result } = renderHookWithProviders(() =>
      useCurrentTeam("project-1")
    )

    await waitFor(() => expect(result.current.team?.id).toBe("team-2"))
  })

  it("falls back to the first team when the persisted id doesn't belong to the project", async () => {
    localStorage.setItem("teamId", "team-nonexistent")
    mockTeams([buildTeam()])

    const { result } = renderHookWithProviders(() =>
      useCurrentTeam("project-1")
    )

    await waitFor(() => expect(result.current.team?.id).toBe("team-1"))
  })

  it("persists the selected team id when selectTeam is called", async () => {
    mockTeams([
      buildTeam(),
      buildTeam({ id: "team-2", name: "Team Beta", isDefault: false }),
    ])

    const { result } = renderHookWithProviders(() =>
      useCurrentTeam("project-1")
    )
    await waitFor(() => expect(result.current.teams).toHaveLength(2))

    act(() => {
      result.current.selectTeam(
        buildTeam({ id: "team-2", name: "Team Beta", isDefault: false })
      )
    })

    expect(localStorage.getItem("teamId")).toBe("team-2")
    await waitFor(() => expect(result.current.team?.id).toBe("team-2"))
  })
})
