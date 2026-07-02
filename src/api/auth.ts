import type {
  LoginCredentials,
  LoginResponse,
  RegisterCredentials,
  RegisterResponse,
  User,
} from "@/types/auth"

export async function login(
  credentials: LoginCredentials
): Promise<LoginResponse> {
  const response = await fetch("/api/users/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  })

  return response.json() as Promise<LoginResponse>
}

export async function register(
  credentials: RegisterCredentials
): Promise<RegisterResponse> {
  const response = await fetch("/api/users/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  })

  return response.json() as Promise<RegisterResponse>
}

export async function getCurrentUser(): Promise<User> {
  const response = await fetch("/api/users/me", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  return response.json() as Promise<User>
}
