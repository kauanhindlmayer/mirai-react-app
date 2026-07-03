import { get, patch, post, put } from "@/lib/api-client"
import type {
  LoginCredentials,
  LoginResponse,
  RegisterCredentials,
  User,
} from "@/types/auth"

export function registerUser(credentials: RegisterCredentials): Promise<string> {
  return post("/users/register", credentials)
}

export function loginUser(credentials: LoginCredentials): Promise<LoginResponse> {
  return post("/users/login", credentials)
}

export function getCurrentUser(): Promise<User> {
  return get("/users/me")
}

export function updateUserProfile(request: {
  firstName: string
  lastName: string
}): Promise<void> {
  return put("/users/profile", request)
}

export function updateAvatar(file: File): Promise<void> {
  const formData = new FormData()
  formData.append("file", file)
  return patch("/users/avatar", formData)
}
