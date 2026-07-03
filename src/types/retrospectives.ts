export type Retrospective = {
  id: string
  title: string
  maxVotesPerUser: number
  template: ProcessTemplate
  columns: RetrospectiveColumn[]
}

export const ProcessTemplate = {
  Classic: "Classic",
  StartStopContinue: "StartStopContinue",
  MadSadGlad: "MadSadGlad",
  LikedLearnedLackedLongedFor: "LikedLearnedLackedLongedFor",
  Sailboat: "Sailboat",
} as const

export type ProcessTemplate =
  (typeof ProcessTemplate)[keyof typeof ProcessTemplate]

export type RetrospectiveSummary = {
  id: string
  title: string
}

export type RetrospectiveColumn = {
  id: string
  title: string
  position: number
  items: RetrospectiveItem[]
}

export type RetrospectiveItem = {
  id: string
  content: string
  position: number
  authorId: string
  votes: number
  createdAtUtc: string
}

export type CreateRetrospectiveRequest = {
  teamId: string
  title: string
  maxVotesPerUser?: number
  template?: ProcessTemplate
}

export type UpdateRetrospectiveRequest = {
  title: string
  maxVotesPerUser?: number
  template?: ProcessTemplate
}
