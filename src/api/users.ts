import { get, patch, post, put } from "@/lib/api-client"
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ResetPasswordRequest,
  User,
  UserProfile,
} from "@/types/users"

export function registerUser(credentials: RegisterRequest): Promise<string> {
  return post("/users/register", credentials)
}

export function loginUser(credentials: LoginRequest): Promise<LoginResponse> {
  return post("/users/login", credentials)
}

export function loginWithGitHub(
  code: string,
  redirectUri: string
): Promise<LoginResponse> {
  return post("/users/login/github", { code, redirectUri })
}

export function getCurrentUser(): Promise<User> {
  return get("/users/me")
}

export function getUserProfile(
  organizationId: string,
  userId: string
): Promise<UserProfile> {
  return get(`/organizations/${organizationId}/users/${userId}/profile`)
}

export function forgotPassword(email: string): Promise<void> {
  return post("/users/forgot-password", { email })
}

export function resetPassword(request: ResetPasswordRequest): Promise<void> {
  return post("/users/reset-password", request)
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
