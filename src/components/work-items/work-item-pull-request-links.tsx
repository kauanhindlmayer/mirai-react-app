import { useMemo, useState } from "react"
import {
  ExternalLinkIcon,
  GitPullRequestIcon,
  PlusIcon,
  XIcon,
} from "lucide-react"

import { useGitHubPullRequestsSearchQuery } from "@/queries/github"
import {
  useLinkPullRequestToWorkItemMutation,
  useRemovePullRequestLinkMutation,
  workItemQueryKey,
} from "@/queries/work-items"
import {
  PullRequestLinkState,
  type WorkItemPullRequestLink,
} from "@/types/work-items"
import { useCurrentProject } from "@/hooks/use-current-project"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useSignalR } from "@/hooks/use-signalr"
import { useWorkItemContext } from "@/components/work-items/work-item-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const STATE_BADGE_VARIANT: Record<
  PullRequestLinkState,
  "outline" | "default" | "secondary"
> = {
  [PullRequestLinkState.Open]: "outline",
  [PullRequestLinkState.Merged]: "default",
  [PullRequestLinkState.Closed]: "secondary",
}

type WorkItemPullRequestLinksProps = {
  pullRequestLinks: WorkItemPullRequestLink[]
}

export function WorkItemPullRequestLinks({
  pullRequestLinks,
}: WorkItemPullRequestLinksProps) {
  const { projectId, workItemId } = useWorkItemContext()
  const { project } = useCurrentProject()
  const deleteLink = useRemovePullRequestLinkMutation(projectId, workItemId)

  const signalREvents = useMemo(
    () => [
      {
        event: "pull-request-links-updated",
        queryKey: workItemQueryKey(projectId, workItemId),
      },
    ],
    [projectId, workItemId]
  )
  useSignalR("/hubs/github", signalREvents)

  if (!project?.gitHubRepositoryConnection) {
    return null
  }

  return (
    <div className="flex flex-col gap-3">
      {pullRequestLinks.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {pullRequestLinks.map((link) => (
            <li
              key={link.id}
              className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm"
            >
              <GitPullRequestIcon className="size-3.5 text-muted-foreground" />
              <a
                href={link.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 truncate underline-offset-4 hover:underline"
              >
                #{link.pullRequestNumber} {link.title}
              </a>
              <Badge variant={STATE_BADGE_VARIANT[link.state]}>
                {link.state}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={() => deleteLink.mutate(link.id)}
                aria-label="Remove pull request link"
              >
                <XIcon className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          No linked pull requests.
        </p>
      )}
      <AddPullRequestLinkPopover organizationId={project.organizationId} />
    </div>
  )
}

function AddPullRequestLinkPopover({
  organizationId,
}: {
  organizationId: string
}) {
  const { projectId, workItemId } = useWorkItemContext()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search)
  const createLink = useLinkPullRequestToWorkItemMutation(projectId, workItemId)

  const { data: pullRequests } = useGitHubPullRequestsSearchQuery(
    organizationId,
    projectId,
    debouncedSearch,
    { enabled: open && debouncedSearch.trim().length > 0 }
  )

  function handleSelect(pullRequestNumber: number) {
    createLink.mutate(
      { pullRequestNumber },
      { onSuccess: () => setOpen(false) }
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="w-fit gap-1">
          <PlusIcon className="size-3.5" />
          Link pull request
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search pull requests..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No pull requests found.</CommandEmpty>
            <CommandGroup>
              {(pullRequests ?? []).map((pullRequest) => (
                <CommandItem
                  key={pullRequest.id}
                  disabled={createLink.isPending}
                  onSelect={() => handleSelect(pullRequest.number)}
                >
                  <span className="flex-1 truncate">
                    #{pullRequest.number} {pullRequest.title}
                  </span>
                  <ExternalLinkIcon className="size-3.5 text-muted-foreground" />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
