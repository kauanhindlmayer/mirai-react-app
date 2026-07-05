# Forgot Password / Reset Password

**Deliverable:** this plan will be written as `mirai-react-app/docs/forgot-password-plan.md`, following the existing precedent of `github-oauth-sign-in-plan.md` — a single cross-repo design doc covering both the `mirai-api` and `mirai-react-app` changes for this feature.

## Context

Mirai currently has no way for a user who forgets their password to regain access to their account.
The login form (`mirai-react-app/src/components/auth/login-form.tsx`) already ships a "Forgot your password?" link, but it points at `href="#"` — dead UI waiting to be wired up.

All authentication is brokered through **Keycloak** (see `mirai-api/docs/adr/0003-add-github-oauth-login.md`): the API never stores password hashes itself, and the codebase relies on the invariant "the API is the only thing that talks to Keycloak" (`AuthenticationOptions`, `KeycloakOptions`, `JwtService`, `AuthenticationService`). Any password-reset design must preserve that invariant rather than exposing Keycloak to the frontend.

**Chosen approach:** the API owns the reset token lifecycle and email, exactly the way it already owns registration/login, and only talks to Keycloak's Admin API as the final step to actually change the password. This is preferred over Keycloak's built-in `execute-actions-email` flow because that flow redirects users to a Keycloak-hosted page, which would break the frontend's existing full-screen auth page pattern (`LoginPage`/`SignupPage`) and give us no control over email branding. This mirrors the reasoning already recorded in ADR 0003, and a new ADR should record it the same way.

Flow:

1. User submits their email on a new `/forgot-password` page → API generates a random token, stores it (with an expiry) on the local `User` row, and emails a link containing the token back to a new `/reset-password` frontend page.
2. User opens the link, sets a new password → API validates the token/expiry, then calls Keycloak's Admin API (`PUT /admin/realms/{realm}/users/{id}/reset-password`) to actually change the password — the same Admin API + `AuthenticationService` HTTP client already used to create Keycloak users at registration.
3. To prevent user enumeration, the "forgot password" endpoint always returns success regardless of whether the email exists, and only sends an email when it does.

---

## Backend (`mirai-api`)

### Domain — `src/Domain/Users/User.cs`

Add nullable `PasswordResetToken` (string) and `PasswordResetTokenExpiresAtUtc` (DateTime) properties, plus mutator methods following the existing style of `SetIdentityId`/`SetImage`:

- `SetPasswordResetToken(string token, DateTime expiresAtUtc)`
- `ClearPasswordResetToken()`

### Persistence

- `src/Infrastructure/Persistence/Configurations/UserConfigurations.cs`: configure the two new columns as nullable; add a non-unique index on `PasswordResetToken` (tokens are random and short-lived, but an index keeps the lookup query fast).
- `src/Domain/Users/IUserRepository.cs` + `src/Infrastructure/Persistence/Repositories/UserRepository.cs`: add `Task<User?> GetByPasswordResetTokenAsync(string token, CancellationToken cancellationToken = default)`, mirroring the existing `GetByEmailAsync`.
- New migration per `docs/migrations.md`:
  ```
  dotnet ef migrations add AddPasswordResetTokenToUser --project src/Infrastructure --startup-project src/Presentation -o Persistence/Migrations
  ```

### Keycloak integration — reuse the existing Admin API client

- `src/Application/Abstractions/Authentication/IAuthenticationService.cs`: add `Task ResetPasswordAsync(string identityId, string newPassword, CancellationToken cancellationToken = default)`.
- `src/Infrastructure/Authentication/AuthenticationService.cs`: implement it by `PUT`-ing a `CredentialRepresentationModel { Type = "password", Value = newPassword, Temporary = false }` to `users/{identityId}/reset-password`, using the same injected `HttpClient` (already base-addressed to `KeycloakOptions.AdminUrl` in `DependencyInjection.cs`) that `RegisterAsync` uses for user creation. No new `HttpClient` registration needed.

### Application layer (CQRS, mirrors `RegisterUser`/`LoginUser`)

- `src/Application/Users/Commands/ForgotPassword/`
  - `ForgotPasswordCommand(string Email) : IRequest<ErrorOr<Success>>`
  - `ForgotPasswordCommandValidator`: `Email` not empty + valid email format (same as `RegisterUserCommandValidator`).
  - `ForgotPasswordCommandHandler`: look up user via `IUserRepository.GetByEmailAsync`. If not found, return `Result.Success` without side effects (avoids enumeration). If found, generate a cryptographically random token (e.g. `RandomNumberGenerator.GetHexString(64)`), set it with a short expiry (e.g. 1 hour) via `user.SetPasswordResetToken(...)`, persist through the existing unit of work, then call `IEmailService.SendEmailAsync` with a link to the frontend's `/reset-password?token=...&email=...`. Always return `Result.Success`.
- `src/Application/Users/Commands/ResetPassword/`
  - `ResetPasswordCommand(string Email, string Token, string NewPassword) : IRequest<ErrorOr<Success>>`
  - `ResetPasswordCommandValidator`: `Token` not empty; `NewPassword` reuses the same complexity rules as `RegisterUserCommandValidator.Password` (min 8 chars, upper/lower/digit).
  - `ResetPasswordCommandHandler`: look up user via the new `GetByPasswordResetTokenAsync`; verify the email matches and the token hasn't expired (`DateTime.UtcNow <= PasswordResetTokenExpiresAtUtc`) — otherwise return a new `UserErrors.InvalidOrExpiredPasswordResetToken`. On success, call `IAuthenticationService.ResetPasswordAsync(user.IdentityId, newPassword)`, then `user.ClearPasswordResetToken()` and save.
- `src/Domain/Users/UserErrors.cs`: add `InvalidOrExpiredPasswordResetToken` (`Error.Validation`).

Email content uses the existing `IEmailService.SendEmailAsync(to, subject, body, ct)` (`src/Infrastructure/Email/EmailService.cs`) — today it only logs, same as the other two existing call sites (`UserAddedToOrganizationDomainEventHandler`, `UserAddedToProjectDomainEventHandler`), so this feature is consistent with that existing limitation; wiring a real email provider is a separate concern, not part of this change.

The reset link needs a frontend base URL. Add a `Frontend:BaseUrl` config entry (e.g. `https://miraihq.com` in prod, `https://localhost:5173` in dev), following the same `IOptions`-style pattern as `KeycloakOptions`, and read it in `ForgotPasswordCommandHandler` to build the link.

### Presentation

- `src/Presentation/Controllers/Users/UsersController.cs`: two new `[AllowAnonymous]` actions:
  - `POST api/users/forgot-password` → `ForgotPasswordRequest { Email }` → `ForgotPasswordCommand`. Always returns `200 OK`.
  - `POST api/users/reset-password` → `ResetPasswordRequest { Email, Token, NewPassword }` → `ResetPasswordCommand`. Returns `200 OK` on success, maps `UserErrors.InvalidOrExpiredPasswordResetToken` to a `400`/`Problem` response the same way `LoginUser`'s `InvalidCredentials` is mapped today.
- New DTOs: `src/Presentation/Controllers/Users/ForgotPasswordRequest.cs`, `ResetPasswordRequest.cs`.
- `tests/Presentation.FunctionalTests/Infrastructure/Routes.cs`: add `ForgotPassword`/`ResetPassword` route constants to `Routes.Users`.

### Tests (follow existing conventions in `.claude/rules/test-standards.md`)

- `tests/Application.UnitTests/Users/Commands/ForgotPasswordTests.cs`: user found → token set + email sent; user not found → no email sent, still returns success.
- `tests/Application.UnitTests/Users/Commands/ResetPasswordTests.cs`: valid token → calls `IAuthenticationService.ResetPasswordAsync` and clears token; expired token → error; token/email mismatch → error.
- `tests/Application.IntegrationTests/Users/Commands/ForgotPasswordTests.cs` and `ResetPasswordTests.cs`, extending `BaseIntegrationTest`, mirroring `RegisterUserTests.cs`.
- `tests/Presentation.FunctionalTests/Users/ForgotPasswordTests.cs` and `ResetPasswordTests.cs`, mirroring `LoginUserTests.cs`; extend `UserRequestFactory.cs` with request builders for the new DTOs.

### ADR

- `docs/adr/0004-add-password-reset.md`: record the decision (app-owned token + email vs. Keycloak's `execute-actions-email`), following the exact structure of `0003-add-github-oauth-login.md` (Context / Decision / Alternatives Considered / Consequences).

---

## Frontend (`mirai-react-app`)

### Routes — `src/routes.ts`

Add two top-level routes (outside the authenticated layout, alongside `login`/`signup`), both guarded the same way as those pages:

```ts
route("forgot-password", "./pages/auth/ForgotPasswordPage.tsx"),
route("reset-password", "./pages/auth/ResetPasswordPage.tsx"),
```

### Pages

- `src/pages/auth/ForgotPasswordPage.tsx` and `ResetPasswordPage.tsx`, reusing the split-screen shell from `LoginPage.tsx`/`SignupPage.tsx`, each with `export const clientMiddleware = [redirectIfAuthenticated]`.

### Components

- `src/components/auth/forgot-password-form.tsx`: single email field (`react-hook-form` + `zod`, same `Field`/`FieldError` primitives as `login-form.tsx`). On submit, calls the new mutation; on success shows an inline confirmation message ("If an account exists for that email, we've sent a reset link") rather than navigating — this avoids leaking whether the email exists, matching the backend's enumeration-safe behavior.
- `src/components/auth/reset-password-form.tsx`: reads `token`/`email` via `useSearchParams()`; new-password + confirm-password fields with a `.refine()` cross-field check identical to `signup-form.tsx`'s password confirmation. On submit, calls the reset mutation; on success, toasts and navigates to `/login`.
- Both get co-located `*.test.tsx` following `login-form.test.tsx`/`signup-form.test.tsx` conventions (MSW handlers via `server.use(...)`, `renderWithProviders`).

### API / hooks

- `src/api/users.ts`: add
  ```ts
  export function forgotPassword(email: string): Promise<void> {
    return post("/users/forgot-password", { email })
  }
  export function resetPassword(request: ResetPasswordRequest): Promise<void> {
    return post("/users/reset-password", request)
  }
  ```
- `src/types/users.ts`: add `ResetPasswordRequest = { email: string; token: string; newPassword: string }`.
- `src/hooks/use-auth.ts`: add `useForgotPasswordMutation()` and `useResetPasswordMutation()`, following the existing `useLoginMutation` structure (these don't set an access token — just call the API and report success/error via `toast`).
- `src/lib/api-client.ts`: add `/users/forgot-password` and `/users/reset-password` to `PUBLIC_PATHS` (unauthenticated calls, and reset-password must not trigger the 401 hard-redirect).

### Wire up the existing dead link

- `src/components/auth/login-form.tsx` (~line 81-86): replace `<a href="#">Forgot your password?</a>` with `<Link to="/forgot-password">Forgot your password?</Link>`.

---

## Verification

1. Backend: `dotnet test` (new unit/integration/functional suites above).
2. Frontend: `pnpm typecheck && pnpm lint && pnpm test`.
3. End-to-end (`dotnet run --project src/AppHost` + `pnpm start`):
   - Go to `/login`, click "Forgot your password?" → lands on `/forgot-password`.
   - Submit a registered email → confirm the confirmation message appears; check the API's console/log output (since `EmailService` currently only logs) for the generated reset link and token.
   - Open the logged link → lands on `/reset-password?token=...&email=...` → submit a new password meeting the complexity rules → confirm redirect/toast to `/login`.
   - Log in with the new password → succeeds. Log in with the old password → fails.
   - Submit `/forgot-password` with a non-registered email → confirm the same confirmation message shows (no enumeration signal) and no email is logged.
   - Try reusing the same reset link a second time, or an expired/garbage token → confirm a clear error and no password change.
