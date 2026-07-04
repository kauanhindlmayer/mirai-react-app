# Sign in with GitHub

## Context

Mirai's frontend (`mirai-react-app`) already ships two non-functional "Continue with GitHub" buttons (`src/components/auth/login-form.tsx:108`, `src/components/auth/signup-form.tsx:254`) — the UI intent already exists, it's just not wired to anything. The backend (`mirai-api`) has **zero** OAuth/GitHub code today: all authentication is brokered through **Keycloak**, using the OAuth2 Resource Owner Password Credentials (ROPC/"direct grant") flow — the API POSTs email+password directly to Keycloak's token endpoint via the confidential `mirai-auth-client`, and Keycloak-issued JWTs are validated by the API's JWT bearer middleware. The local Postgres `Users` table stores a lightweight profile keyed by `IdentityId` (the Keycloak `sub` claim), populated at registration time.

GitHub sign-in requires a **redirect-based Authorization Code flow**, which is architecturally different from today's password grant (no password to submit — the user authenticates on GitHub, not in our UI). The chosen approach (confirmed with the user) keeps the existing architecture intact: **the backend brokers the entire token exchange**, exactly like it already brokers the password grant. The frontend never talks to Keycloak directly for tokens — it only does a full-page redirect to Keycloak's authorize endpoint and later hands the resulting `code` to the API. This avoids introducing a second, public/PKCE Keycloak client and keeps the "API is the only thing that talks to Keycloak" invariant this codebase already relies on (`AuthenticationOptions`, `KeycloakOptions`, `JwtService`, `AuthenticationService`).

Goal: clicking "Continue with GitHub" logs the user in (creating a local `User` row on first login, or linking to an existing password-registered account by email), ending in the same authenticated state (`accessToken` in `localStorage`, `useCurrentUser()` populated) as today's email/password login.

## Flow

1. User clicks "Continue with GitHub" → frontend does `window.location.href = <Keycloak authorize URL>?...&kc_idp_hint=github`.
2. Keycloak sees `kc_idp_hint=github` and redirects straight to GitHub's OAuth consent screen (skips Keycloak's own login form).
3. GitHub redirects back to Keycloak's broker endpoint; Keycloak's "First Broker Login" flow creates/links a Keycloak-side federated user and redirects the browser to our registered `redirect_uri` — a new frontend route — with `?code=...`.
4. Frontend's new callback page reads `code`, POSTs it to a new API endpoint `POST /api/users/login/github`.
5. API exchanges the code for a Keycloak access token (`grant_type=authorization_code`, using the existing confidential client secret — same trust boundary as the password grant), decodes the token's claims (`sub`, `email`, `given_name`, `family_name` — already mapped by the realm's built-in `profile`/`email` scopes), then finds-or-creates the local `User` by `IdentityId`/`Email`, and returns the same `AccessTokenResponse { accessToken }` shape the frontend already knows how to consume.
6. Frontend stores the token and user exactly like `useLogin()` does today, then navigates to `/`.

## Backend changes (`mirai-api`)

### Keycloak realm/client config
- `.files/mirai-realm-export.json`: on the `mirai-auth-client` entry, set `standardFlowEnabled: true` and add a `redirectUris` entry for the frontend callback (e.g. `https://localhost:5173/auth/github/callback`) plus a matching `webOrigins` entry. This is non-secret config, safe to commit (mirrors how `directAccessGrantsEnabled`/`webOrigins` are already set on this client).
- **Do not** commit a real GitHub Client ID/Secret into the realm JSON's `identityProviders` array (currently `[]`). Following this repo's existing secrets convention (Aspire-prompted / `dotnet user-secrets`, see `CLAUDE.md` "Secrets Management"), document a one-time manual step in `docs/getting-started.md`: register a GitHub OAuth App, then add it as an Identity Provider (alias `github`) via the Keycloak Admin Console (persisted in the Keycloak container's data volume, `WithDataVolume()` in `AppHost/Program.cs`) — not checked into git.
- For deployed environments, add `builder.AddParameter("GitHubClientId")` / `builder.AddParameter("GitHubClientSecret", secret: true)` in `src/AppHost/Program.cs` alongside the existing `keycloakAuthClientSecret`/`keycloakAdminClientSecret` parameters, for whatever provisioning mechanism configures the hosted Keycloak's identity provider (out of scope to fully automate now — note as a follow-up in the ADR).

### Application/Infrastructure
- `src/Domain/Users/IUserRepository.cs`: add `Task<User?> GetByIdentityIdAsync(string identityId, CancellationToken cancellationToken = default)` (mirrors `GetByEmailAsync`); implement in the EF repository under `Infrastructure/Persistence/Repositories/UserRepository.cs`. (Today only `AuthorizationService.cs` does this lookup ad hoc via raw `DbContext` query for claims transformation — the new command needs it through the repository, consistent with existing `IUserRepository` usage.)
- `src/Application/Abstractions/Authentication/IJwtService.cs` + `src/Infrastructure/Authentication/JwtService.cs`: add `Task<ErrorOr<string>> GetAccessTokenByAuthorizationCodeAsync(string code, string redirectUri, CancellationToken cancellationToken = default)`, POSTing `grant_type=authorization_code`, `code`, `redirect_uri`, `client_id`, `client_secret` to the same Keycloak token endpoint `_httpClient` already targets in `GetAccessTokenAsync` — same shape/error handling (`UserErrors.InvalidCredentials` on failure).
- New feature folder `src/Application/Users/Commands/LoginWithGitHub/` (mirrors `RegisterUser`/`LoginUser`):
  - `LoginWithGitHubCommand(string Code, string RedirectUri)` : `IRequest<ErrorOr<AccessTokenResponse>>`
  - `LoginWithGitHubCommandHandler`:
    1. Call `IJwtService.GetAccessTokenByAuthorizationCodeAsync` → on error, propagate.
    2. Decode the returned JWT (`JwtSecurityTokenHandler().ReadJwtToken(...)`) to read `sub`, `email`, `given_name`, `family_name`.
    3. `_userRepository.GetByIdentityIdAsync(sub)` — if found, `UpdateLastActive()`, save, return `AccessTokenResponse`.
    4. Else `_userRepository.GetByEmailAsync(email)` — if found (existing password account), call `user.SetIdentityId(sub)` to link, save, return.
    5. Else create `new User(firstName, lastName, email)` + `SetIdentityId(sub)`, `AddAsync`, save, return.
  - Optional `LoginWithGitHubCommandValidator` (FluentValidation) requiring non-empty `Code`/`RedirectUri`.
- `src/Presentation/Controllers/Users/UsersController.cs`: new `[AllowAnonymous] [HttpPost("login/github")]` action `LoginWithGitHub(LoginWithGitHubRequest request, CancellationToken ct)`, mapping to the command, mirroring the existing `LoginUser` action's `Problem`/401 handling. New `Presentation/Controllers/Users/LoginWithGitHubRequest.cs` DTO `{ string Code, string RedirectUri }`.

### Tests (follow existing patterns under `tests/`)
- `tests/Application.UnitTests/Users/Commands/LoginWithGitHubTests.cs` — NSubstitute mocks for `IUserRepository`/`IJwtService`/`IUnitOfWork`, covering: existing-by-identity, link-by-email, create-new.
- `tests/Application.IntegrationTests/Users/Commands/LoginWithGitHubTests.cs` and `tests/Presentation.FunctionalTests/Users/LoginWithGitHubTests.cs` — mirror `LoginUserTests.cs` in both folders (check how those mock/stub the Keycloak token endpoint via `Testcontainers.Keycloak` and reuse the same fixture setup).

### ADR
- `docs/adr/0003-add-github-oauth-login.md` — record the decision: Keycloak-brokered Identity Provider + backend-only Authorization Code exchange (no new public/PKCE client), local `User` just-in-time provisioning by `IdentityId`/`Email`, and the manual (non-committed) IdP secret setup.

## Frontend changes (`mirai-react-app`)

- **Env vars** — add to `.env` / `.env.example`: `VITE_KEYCLOAK_ISSUER` (e.g. `https://localhost:8080/realms/mirai`) and `VITE_KEYCLOAK_CLIENT_ID` (`mirai-auth-client`). These are public identifiers (client_id + issuer), not secrets — the actual client secret stays server-side in `mirai-api`.
- New `src/lib/github-oauth.ts` exporting `getGitHubSignInUrl()`, building `${issuer}/protocol/openid-connect/auth?client_id=...&redirect_uri=${encodeURIComponent(origin + "/auth/github/callback")}&response_type=code&scope=openid email&kc_idp_hint=github`.
- Wire the two existing GitHub buttons (`login-form.tsx:108`, `signup-form.tsx:254`) with `onClick={() => { window.location.href = getGitHubSignInUrl() }}` (full-page redirect, not a mutation).
- `src/routes.ts`: add `route("auth/github/callback", "./pages/auth/GitHubCallbackPage.tsx")` at the top level, alongside `login`/`signup` (outside the authenticated `layout(...)` tree).
- New `src/pages/auth/GitHubCallbackPage.tsx`: reads `code`/`error` via `useSearchParams()`, calls the new `useGitHubLogin()` hook on mount, shows a `Spinner` while pending, on error toasts and redirects to `/login`.
- `src/api/users.ts`: add `loginWithGitHub(code: string, redirectUri: string): Promise<LoginResponse> { return post("/users/login/github", { code, redirectUri }) }`.
- `src/hooks/use-auth.ts`: add `useGitHubLogin()` mirroring `useLogin()` — mutationFn calls `loginWithGitHub`, `setAccessToken`, fetches/stores current user; `onSuccess` sets query data and navigates to `/`.
- `src/lib/api-client.ts`: add `/users/login/github` to `PUBLIC_PATHS` (line 7) so the interceptor doesn't attach a stale/absent bearer token to the exchange call.

## Verification

1. Local dev: `dotnet run --project src/AppHost` (Aspire), register a GitHub OAuth App (`Homepage URL` = frontend origin, `Authorization callback URL` = Keycloak's `.../realms/mirai/broker/github/endpoint`), add it as a Keycloak Identity Provider (alias `github`) via the Admin Console, and enter the client secret.
2. Click "Continue with GitHub" on `/login` → confirm redirect to GitHub → consent → redirect back to `/auth/github/callback` → lands authenticated on `/`.
3. Inspect the Postgres `Users` table (via the pgAdmin instance Aspire wires up) to confirm a new row was created with the correct `IdentityId`/`Email` on first login, and that a second login with the same GitHub account reuses the same row (no duplicate).
4. Log in with an existing password-registered account's GitHub-linked email and confirm the existing `User` row gets `IdentityId` set (linked) rather than a duplicate being created.
5. Run `dotnet test` (new unit/integration/functional tests above) and the frontend's existing lint/typecheck (`pnpm lint`, `pnpm typecheck` if present) to make sure nothing regresses.
