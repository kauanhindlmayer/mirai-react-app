import { describe, expect, it } from "vitest"

import {
  isRangeAvailable,
  toUnavailableRanges,
} from "@/components/sprints/sprint-dates"
import type { Sprint } from "@/types/sprints"

function buildSprint(overrides: Partial<Sprint> = {}): Sprint {
  return {
    id: "sprint-1",
    name: "Sprint 1",
    startDate: "2026-06-01",
    endDate: "2026-06-14",
    workItemCount: 0,
    ...overrides,
  }
}

const day = (value: string) => new Date(`${value}T00:00:00`)

describe("toUnavailableRanges", () => {
  it("excludes the sprint currently being edited", () => {
    const ranges = toUnavailableRanges(
      [buildSprint(), buildSprint({ id: "sprint-2" })],
      "sprint-1"
    )

    expect(ranges).toHaveLength(1)
  })
})

describe("isRangeAvailable", () => {
  const taken = toUnavailableRanges([buildSprint()])

  it("rejects a range that starts on the day another sprint ends", () => {
    expect(isRangeAvailable(day("2026-06-14"), day("2026-06-28"), taken)).toBe(
      false
    )
  })

  it("accepts a range that starts the day after another sprint ends", () => {
    expect(isRangeAvailable(day("2026-06-15"), day("2026-06-28"), taken)).toBe(
      true
    )
  })

  it("rejects a range that swallows another sprint whole", () => {
    expect(isRangeAvailable(day("2026-05-01"), day("2026-07-01"), taken)).toBe(
      false
    )
  })

  it("accepts any range when no other sprint exists", () => {
    expect(isRangeAvailable(day("2026-06-01"), day("2026-06-14"), [])).toBe(
      true
    )
  })
})
