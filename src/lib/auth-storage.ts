import type { User } from "@/types/auth"

const ACCESS_TOKEN_KEY = "accessToken"
const USER_KEY = "user"

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function setStoredUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuthStorage(): void {
  localStorage.clear()
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1])) as { exp: number }
    return Date.now() >= payload.exp * 1000
  } catch {
    return true
  }
}

export function isAuthenticated(): boolean {
  const token = getAccessToken()
  return !!token && !isTokenExpired(token)
}
