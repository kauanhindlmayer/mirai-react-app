export type LoginCredentials = {
  email: string
  password: string
  rememberMe: boolean
}

export type LoginResponse = {
  accessToken: string
}

export type RegisterCredentials = {
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
