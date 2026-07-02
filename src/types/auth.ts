export type LoginCredentials = {
  email: string
  password: string
}

export type LoginResponse = {
  accessToken: string
}

export type RegisterCredentials = {
  name: string
  email: string
  password: string
}

export type RegisterResponse = {
  message?: string
}

export type User = {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  imageUrl: string
}
