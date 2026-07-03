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

export type User = {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  imageUrl: string
}
