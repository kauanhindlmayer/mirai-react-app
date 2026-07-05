import { describe, expect, it } from "vitest"
import { screen } from "@testing-library/react"

import { RetrospectiveBoard } from "@/components/retrospectives/retrospective-board"
import { renderWithProviders } from "@/test/test-utils"
import type { Retrospective } from "@/types/retrospectives"

function buildRetrospective(
  overrides: Partial<Retrospective> = {}
): Retrospective {
  return {
    id: "retro-1",
    title: "Sprint 1 Retro",
    maxVotesPerUser: 5,
    template: "Classic",
    columns: [],
    ...overrides,
  }
}

describe("RetrospectiveBoard", () => {
  it("renders a column for each of the retrospective's columns", () => {
    renderWithProviders(
      <RetrospectiveBoard
        retrospective={buildRetrospective({
          columns: [
            { id: "column-1", title: "Went Well", position: 1, items: [] },
            { id: "column-2", title: "To Improve", position: 2, items: [] },
          ],
        })}
      />
    )

    expect(screen.getByText("Went Well")).toBeInTheDocument()
    expect(screen.getByText("To Improve")).toBeInTheDocument()
  })

  it("renders nothing but the container when there are no columns", () => {
    const { container } = renderWithProviders(
      <RetrospectiveBoard retrospective={buildRetrospective({ columns: [] })} />
    )

    expect(container.querySelectorAll("h3")).toHaveLength(0)
  })
})
