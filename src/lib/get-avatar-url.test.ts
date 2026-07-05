import { describe, expect, it } from "vitest"

import { getAvatarUrl } from "./get-avatar-url"

describe("getAvatarUrl", () => {
  it("prefixes a relative avatar path with the API base URL", () => {
    expect(getAvatarUrl("/api/users/123/avatar")).toBe(
      `${import.meta.env.VITE_API_URL}/api/users/123/avatar`
    )
  })

  it("returns undefined when the user has no avatar", () => {
    expect(getAvatarUrl(null)).toBeUndefined()
    expect(getAvatarUrl(undefined)).toBeUndefined()
    expect(getAvatarUrl("")).toBeUndefined()
  })
})
