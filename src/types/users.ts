export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  accessToken: string
}

export type RegisterRequest = {
  firstName: string
  lastName: string
  email: string
  password: string
  hasAcceptedTerms: boolean
}

export type ResetPasswordRequest = {
  email: string
  token: string
  newPassword: string
}

export type User = {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  imageUrl: string
}

export type ProfileProject = {
  id: string
  name: string
  roleName: string
}

export type ProfileTeam = {
  id: string
  name: string
  projectName: string
  roleName: string
}

export type UserProfile = {
  id: string
  fullName: string
  email: string
  avatarUrl?: string
  projects: ProfileProject[]
  teams: ProfileTeam[]
}
