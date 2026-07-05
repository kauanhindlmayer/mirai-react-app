import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { getGitHubSignInUrl } from "./github-oauth"

describe("getGitHubSignInUrl", () => {
  const originalLocation = window.location

  beforeEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { origin: "http://localhost:5173" },
    })
  })

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    })
  })

  it("builds a Keycloak authorize URL with the GitHub broker hint and callback redirect", () => {
    const url = new URL(getGitHubSignInUrl())

    expect(`${url.origin}${url.pathname}`).toBe(
      `${import.meta.env.VITE_KEYCLOAK_ISSUER}/protocol/openid-connect/auth`
    )
    expect(url.searchParams.get("client_id")).toBe(
      import.meta.env.VITE_KEYCLOAK_CLIENT_ID
    )
    expect(url.searchParams.get("redirect_uri")).toBe(
      "http://localhost:5173/auth/github/callback"
    )
    expect(url.searchParams.get("response_type")).toBe("code")
    expect(url.searchParams.get("scope")).toBe("openid email")
    expect(url.searchParams.get("kc_idp_hint")).toBe("github")
  })
})
