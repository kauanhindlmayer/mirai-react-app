import { useEffect, useRef } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { toast } from "sonner"

import { useGitHubLoginMutation } from "@/hooks/use-auth"
import { GITHUB_CALLBACK_PATH } from "@/lib/github-oauth"
import { Spinner } from "@/components/ui/spinner"

function showSignInError(description: string) {
  toast.error("GitHub sign-in failed.", { description })
}

export default function GitHubCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { mutate: loginWithGitHub } = useGitHubLoginMutation()
  const hasExchangedCode = useRef(false)

  useEffect(() => {
    // Keycloak authorization codes are single-use, but StrictMode
    // double-invokes this effect in development, so guard against
    // exchanging the same code twice.
    if (hasExchangedCode.current) return

    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (error || !code) {
      showSignInError(error ?? "Missing authorization code.")
      navigate("/login")
      return
    }

    hasExchangedCode.current = true
    loginWithGitHub(
      {
        code,
        redirectUri: `${window.location.origin}${GITHUB_CALLBACK_PATH}`,
      },
      {
        onError: (mutationError) => {
          showSignInError(
            mutationError instanceof Error
              ? mutationError.message
              : "Something went wrong."
          )
          navigate("/login")
        },
      }
    )
  }, [searchParams, navigate, loginWithGitHub])

  return (
    <div className="flex min-h-svh items-center justify-center">
      <Spinner className="size-8" />
    </div>
  )
}
