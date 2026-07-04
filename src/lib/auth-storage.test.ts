import { beforeEach, describe, expect, it } from "vitest"

import {
  clearAuthStorage,
  getAccessToken,
  getStoredUser,
  isAuthenticated,
  isTokenExpired,
  setAccessToken,
  setStoredUser,
} from "@/lib/auth-storage"
import type { User } from "@/types/users"

function buildToken(payload: Record<string, unknown>): string {
  return `header.${btoa(JSON.stringify(payload))}.signature`
}

const user: User = {
  id: "user-1",
  email: "john.doe@mirai.com",
  firstName: "John",
  lastName: "Doe",
  fullName: "John Doe",
  imageUrl: "",
}

beforeEach(() => {
  localStorage.clear()
})

describe("isTokenExpired", () => {
  it("returns false for a token with a future exp claim", () => {
    const token = buildToken({ exp: Math.floor(Date.now() / 1000) + 3600 })
    expect(isTokenExpired(token)).toBe(false)
  })

  it("returns true for a token with a past exp claim", () => {
    const token = buildToken({ exp: Math.floor(Date.now() / 1000) - 3600 })
    expect(isTokenExpired(token)).toBe(true)
  })

  it("returns true for a malformed token", () => {
    expect(isTokenExpired("not-a-jwt")).toBe(true)
  })
})

describe("isAuthenticated", () => {
  it("returns false when no token is stored", () => {
    expect(isAuthenticated()).toBe(false)
  })

  it("returns true when a valid, unexpired token is stored", () => {
    setAccessToken(buildToken({ exp: Math.floor(Date.now() / 1000) + 3600 }))
    expect(isAuthenticated()).toBe(true)
  })

  it("returns false when the stored token is expired", () => {
    setAccessToken(buildToken({ exp: Math.floor(Date.now() / 1000) - 3600 }))
    expect(isAuthenticated()).toBe(false)
  })
})

describe("getAccessToken / setAccessToken", () => {
  it("round-trips the token through localStorage", () => {
    setAccessToken("some-token")
    expect(getAccessToken()).toBe("some-token")
  })
})

describe("getStoredUser / setStoredUser", () => {
  it("returns null when nothing is stored", () => {
    expect(getStoredUser()).toBeNull()
  })

  it("round-trips the user through localStorage", () => {
    setStoredUser(user)
    expect(getStoredUser()).toEqual(user)
  })

  it("returns null when the stored value is malformed JSON", () => {
    localStorage.setItem("user", "{not-json")
    expect(getStoredUser()).toBeNull()
  })
})

describe("clearAuthStorage", () => {
  it("removes both the token and the user", () => {
    setAccessToken("some-token")
    setStoredUser(user)

    clearAuthStorage()

    expect(getAccessToken()).toBeNull()
    expect(getStoredUser()).toBeNull()
  })
})
