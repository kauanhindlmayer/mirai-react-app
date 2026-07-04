import { beforeEach, describe, expect, it } from "vitest"

import { redirectIfAuthenticated, requireAuth } from "@/lib/auth-middleware"
import { setAccessToken } from "@/lib/auth-storage"

function buildToken(payload: Record<string, unknown>): string {
  return `header.${btoa(JSON.stringify(payload))}.signature`
}

function callMiddleware(middleware: unknown): void {
  ;(middleware as () => void)()
}

beforeEach(() => {
  localStorage.clear()
})

describe("requireAuth", () => {
  it("redirects to /login when not authenticated", () => {
    let thrown: unknown
    try {
      callMiddleware(requireAuth)
    } catch (error) {
      thrown = error
    }

    expect(thrown).toBeInstanceOf(Response)
    expect((thrown as Response).status).toBe(302)
    expect((thrown as Response).headers.get("Location")).toBe("/login")
  })

  it("does not redirect when a valid token is stored", () => {
    setAccessToken(buildToken({ exp: Math.floor(Date.now() / 1000) + 3600 }))

    expect(() => callMiddleware(requireAuth)).not.toThrow()
  })
})

describe("redirectIfAuthenticated", () => {
  it("redirects to / when already authenticated", () => {
    setAccessToken(buildToken({ exp: Math.floor(Date.now() / 1000) + 3600 }))

    let thrown: unknown
    try {
      callMiddleware(redirectIfAuthenticated)
    } catch (error) {
      thrown = error
    }

    expect(thrown).toBeInstanceOf(Response)
    expect((thrown as Response).status).toBe(302)
    expect((thrown as Response).headers.get("Location")).toBe("/")
  })

  it("does not redirect when not authenticated", () => {
    expect(() => callMiddleware(redirectIfAuthenticated)).not.toThrow()
  })
})
