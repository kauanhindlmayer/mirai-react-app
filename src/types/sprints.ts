export type CreateSprintRequest = {
  name: string
  startDate: string
  endDate: string
}

export type UpdateSprintRequest = CreateSprintRequest

export type Sprint = {
  id: string
  name: string
  startDate: string
  endDate: string
  workItemCount: number
}
