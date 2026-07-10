export type CreateTeamRequest = {
  name: string
  description: string
}

export type Team = {
  id: string
  name: string
  description?: string
  boardId: string
  isDefault: boolean
  memberCount: number
}

export type TeamMember = {
  id: string
  name: string
  roleId: string
  roleName: string
}

export type BacklogResponse = {
  id: string
  code: number
  type: string
  title: string
  status: string
  storyPoints?: number
  valueArea: string
  tags: string[]
  children: BacklogResponse[]
}

export const BacklogLevel = {
  Epic: "Epic",
  Feature: "Feature",
  UserStory: "UserStory",
} as const

export type BacklogLevel = (typeof BacklogLevel)[keyof typeof BacklogLevel]
