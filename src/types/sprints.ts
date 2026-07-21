export type CreateSprintRequest = {
  name: string
  startDate: string
  endDate: string
}

export type UpdateSprintRequest = CreateSprintRequest

export const SprintStatus = {
  Planned: "Planned",
  Active: "Active",
  Completed: "Completed",
} as const

export type SprintStatus = (typeof SprintStatus)[keyof typeof SprintStatus]

export type Sprint = {
  id: string
  name: string
  startDate: string
  endDate: string
  status: SprintStatus
  startedAtUtc: string | null
  workItemCount: number
}
