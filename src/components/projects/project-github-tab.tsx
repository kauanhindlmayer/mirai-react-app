import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  useDisconnectGitHubRepositoryMutation,
  useGetGitHubInstallUrlMutation,
} from "@/queries/github"
import type { GitHubRepositoryConnection } from "@/types/github"

type ProjectGitHubTabProps = {
  organizationId: string
  projectId: string
  connection?: GitHubRepositoryConnection
}

export function ProjectGitHubTab({
  organizationId,
  projectId,
  connection,
}: ProjectGitHubTabProps) {
  return (
    <div className="flex flex-col items-start gap-3 py-4">
      {connection ? (
        <ConnectedState
          organizationId={organizationId}
          projectId={projectId}
          connection={connection}
        />
      ) : (
        <NotConnectedState
          organizationId={organizationId}
          projectId={projectId}
        />
      )}
    </div>
  )
}

function NotConnectedState({
  organizationId,
  projectId,
}: {
  organizationId: string
  projectId: string
}) {
  const mutation = useGetGitHubInstallUrlMutation(organizationId, projectId)

  function handleConnect() {
    mutation.mutate(undefined, {
      onSuccess: (data) => {
        window.location.href = data.url
      },
    })
  }

  return (
    <>
      <p className="text-sm text-muted-foreground">
        Connect this project to a GitHub repository to automatically link pull
        requests to work items.
      </p>
      <Button
        variant="outline"
        onClick={handleConnect}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? <Spinner data-icon="inline-end" /> : null}
        Connect your GitHub Account
      </Button>
    </>
  )
}

function ConnectedState({
  organizationId,
  projectId,
  connection,
}: {
  organizationId: string
  projectId: string
  connection: GitHubRepositoryConnection
}) {
  const mutation = useDisconnectGitHubRepositoryMutation(
    organizationId,
    projectId
  )
  const repositoryFullName = `${connection.repositoryOwner}/${connection.repositoryName}`

  return (
    <div className="flex items-center gap-3">
      <a
        href={`https://github.com/${repositoryFullName}`}
        target="_blank"
        rel="noreferrer"
        className="text-sm font-medium underline underline-offset-4"
      >
        {repositoryFullName}
      </a>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm">
            Disconnect
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect GitHub repository?</AlertDialogTitle>
            <AlertDialogDescription>
              Mirai will stop linking new pull requests from{" "}
              {repositoryFullName} to work items. Existing links are kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
