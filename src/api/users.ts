import { get, patch, post, put } from "@/lib/api-client"
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
} from "@/types/users"

export function registerUser(credentials: RegisterRequest): Promise<string> {
  return post("/users/register", credentials)
}

export function loginUser(credentials: LoginRequest): Promise<LoginResponse> {
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
