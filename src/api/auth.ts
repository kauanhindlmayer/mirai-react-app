import type { LoginCredentials, LoginResponse } from "@/types/auth"

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
