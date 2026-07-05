export const GITHUB_CALLBACK_PATH = "/auth/github/callback"

export function getGitHubSignInUrl(): string {
  const issuer = import.meta.env.VITE_KEYCLOAK_ISSUER
  const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID
  const redirectUri = `${window.location.origin}${GITHUB_CALLBACK_PATH}`

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email",
    kc_idp_hint: "github",
  })

  return `${issuer}/protocol/openid-connect/auth?${params.toString()}`
}
