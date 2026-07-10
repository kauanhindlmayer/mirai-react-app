import { useCallback, useEffect, useMemo, useRef } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { toast } from "sonner"

import {
  useConnectGitHubRepositoryMutation,
  useGitHubInstallationRepositoriesQuery,
} from "@/queries/github"
import type { GitHubRepository } from "@/types/github"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Spinner } from "@/components/ui/spinner"

type DecodedState = {
  organizationId: string
  projectId: string
}

function decodeState(state: string): DecodedState | null {
  try {
    const [organizationId, projectId] = atob(state).split("|")
    if (!organizationId || !projectId) return null
    return { organizationId, projectId }
  } catch {
    return null
  }
}

function showInstallationError(description: string) {
  toast.error("GitHub installation failed.", { description })
}

export default function GitHubInstallationCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const hasAutoConnected = useRef(false)

  const state = searchParams.get("state") ?? ""
  const installationId = Number(searchParams.get("installation_id"))
  const decodedState = useMemo(() => decodeState(state), [state])
  const isValidRequest =
    decodedState !== null &&
    Number.isInteger(installationId) &&
    installationId > 0

  const organizationId = decodedState?.organizationId ?? ""
  const projectId = decodedState?.projectId ?? ""

  const { data: repositories, isError } =
    useGitHubInstallationRepositoriesQuery(
      organizationId,
      projectId,
      installationId,
      state,
      { enabled: isValidRequest }
    )

  const { mutate: connect, isPending: isConnecting } =
    useConnectGitHubRepositoryMutation(organizationId, projectId)

  const connectRepository = useCallback(
    (repository: GitHubRepository) => {
      connect(
        {
          installationId,
          repositoryId: repository.id,
          repositoryOwner: repository.owner,
          repositoryName: repository.name,
        },
        {
          onSuccess: () => toast.success("GitHub repository connected."),
          onSettled: () =>
            navigate(`/projects/${projectId}/settings?tab=github`),
        }
      )
    },
    [connect, installationId, navigate, projectId]
  )

  useEffect(() => {
    if (!isValidRequest) {
      showInstallationError("This installation link is invalid or has expired.")
      navigate("/organizations")
      return
    }

    if (hasAutoConnected.current || !repositories) return

    if (repositories.length === 0) {
      showInstallationError(
        "No repositories are accessible to this installation."
      )
      navigate(`/projects/${projectId}/settings?tab=github`)
      return
    }

    if (repositories.length === 1) {
      hasAutoConnected.current = true
      connectRepository(repositories[0])
    }
  }, [isValidRequest, repositories, projectId, navigate, connectRepository])

  if (isError) {
    return (
      <div className="flex min-h-svh items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">
          Failed to load repositories for this installation.
        </p>
      </div>
    )
  }

  if (!repositories || repositories.length <= 1 || isConnecting) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-4">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-lg font-semibold">Choose a repository</h1>
        <p className="text-sm text-muted-foreground">
          This installation has access to multiple repositories. Pick the one to
          connect to this project.
        </p>
      </div>
      <Command className="w-full max-w-sm rounded-md border">
        <CommandInput placeholder="Search repositories..." />
        <CommandList>
          <CommandEmpty>No repositories found.</CommandEmpty>
          <CommandGroup>
            {repositories.map((repository) => (
              <CommandItem
                key={repository.id}
                onSelect={() => connectRepository(repository)}
              >
                {repository.owner}/{repository.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  )
}
