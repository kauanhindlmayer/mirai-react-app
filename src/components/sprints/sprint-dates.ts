import { format, parseISO, subDays } from "date-fns"
import type { DateRange } from "react-day-picker"

import type { Sprint } from "@/types/sprints"

const DATE_FORMAT = "yyyy-MM-dd"
const DISPLAY_FORMAT = "d MMM yyyy"

export function parseSprintDate(value: string): Date | undefined {
  return value ? parseISO(value) : undefined
}

export function formatSprintDate(date: Date): string {
  return format(date, DATE_FORMAT)
}

export function formatSprintDay(value: string): string | null {
  const date = parseSprintDate(value)
  return date ? format(date, DISPLAY_FORMAT) : null
}

export function formatSprintDateRange(startDate: string, endDate: string) {
  const start = parseSprintDate(startDate)
  const end = parseSprintDate(endDate)
  if (!start || !end) return null

  return `${format(start, DISPLAY_FORMAT)} – ${format(end, DISPLAY_FORMAT)}`
}

/**
 * The days already covered by the team's other sprints. Sprints in a team may
 * not overlap, so the calendars disable these rather than letting the user build
 * a range the API will reject.
 */
export function toUnavailableRanges(
  sprints: Sprint[],
  editingSprintId?: string
): DateRange[] {
  return sprints
    .filter((sprint) => sprint.id !== editingSprintId)
    .map((sprint) => ({
      from: parseISO(sprint.startDate),
      to: parseISO(sprint.endDate),
    }))
}

/**
 * Sprint date ranges include both endpoints, so a sprint ending on the 14th and
 * one starting on the 15th are back-to-back rather than overlapping.
 */
export function isRangeAvailable(
  from: Date,
  to: Date,
  unavailableRanges: DateRange[]
): boolean {
  return !unavailableRanges.some(
    (range) => range.from && range.to && range.from <= to && from <= range.to
  )
}

/**
 * The last day a sprint starting on `startDate` may end on: the day before the
 * next sprint begins. Without this an end date could be picked beyond a sprint
 * that starts later, silently spanning it.
 */
export function findLatestSelectableEnd(
  startDate: Date,
  unavailableRanges: DateRange[]
): Date | undefined {
  const laterStarts = unavailableRanges
    .map((range) => range.from)
    .filter((from): from is Date => !!from && from > startDate)
    .sort((a, b) => a.getTime() - b.getTime())

  const nextSprintStart = laterStarts.at(0)
  return nextSprintStart ? subDays(nextSprintStart, 1) : undefined
}
