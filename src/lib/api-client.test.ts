import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { getAccessToken, setAccessToken } from "@/lib/auth-storage"
import { server } from "@/test/mocks/server"

import { ApiError, get, patch, post } from "./api-client"

beforeEach(() => {
  localStorage.clear()
})

describe("get", () => {
  it("returns the parsed JSON body on success", async () => {
    server.use(
      http.get("*/api/users/me", () =>
        HttpResponse.json({ id: "1", email: "john.doe@mirai.com" })
      )
    )

    await expect(get("/users/me")).resolves.toEqual({
      id: "1",
      email: "john.doe@mirai.com",
    })
  })

  it("returns undefined for a 204 No Content response", async () => {
    server.use(
      http.patch(
        "*/api/users/avatar",
        () => new HttpResponse(null, { status: 204 })
      )
    )

    await expect(patch("/users/avatar")).resolves.toBeUndefined()
  })

  it("attaches the stored bearer token as an Authorization header", async () => {
    setAccessToken("my-token")
    server.use(
      http.get("*/api/users/me", ({ request }) =>
        HttpResponse.json({
          authorization: request.headers.get("Authorization"),
        })
      )
    )

    await expect(get("/users/me")).resolves.toEqual({
      authorization: "Bearer my-token",
    })
  })

  it("does not attach an Authorization header for public paths", async () => {
    setAccessToken("my-token")
    server.use(
      http.post("*/api/users/login", ({ request }) =>
        HttpResponse.json({
          authorization: request.headers.get("Authorization"),
        })
      )
    )

    await expect(
      post("/users/login", { email: "a@b.com", password: "pw" })
    ).resolves.toEqual({ authorization: null })
  })
})

describe("error handling", () => {
  it("wraps a problem-details error response in an ApiError with the resolved detail", async () => {
    server.use(
      http.get("*/api/users/me", () =>
        HttpResponse.json(
          { title: "Bad Request", detail: "Email already in use", errors: {} },
          { status: 400 }
        )
      )
    )

    await expect(get("/users/me")).rejects.toMatchObject({
      message: "Email already in use",
      status: 400,
    })
  })

  it("joins field validation errors when no detail is present", async () => {
    server.use(
      http.get("*/api/users/me", () =>
        HttpResponse.json(
          { title: "Bad Request", errors: { Email: ["is required"] } },
          { status: 400 }
        )
      )
    )

    await expect(get("/users/me")).rejects.toMatchObject({
      message: "is required",
      status: 400,
    })
  })

  it("propagates network-level failures (no response) unchanged", async () => {
    server.use(http.get("*/api/users/me", () => HttpResponse.error()))

    await expect(get("/users/me")).rejects.not.toBeInstanceOf(ApiError)
  })
})

describe("401 handling", () => {
  const originalLocation = window.location

  beforeEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { href: "http://localhost:3000/" },
    })
  })

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    })
  })

  it("clears auth storage and redirects to /login", async () => {
    setAccessToken("expired-token")
    server.use(
      http.get("*/api/users/me", () =>
        HttpResponse.json({ title: "Unauthorized" }, { status: 401 })
      )
    )

    await expect(get("/users/me")).rejects.toBeInstanceOf(ApiError)
    expect(getAccessToken()).toBeNull()
    expect(window.location.href).toBe("/login")
  })
})
