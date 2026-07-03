import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { LinkIcon, PlusIcon, XIcon } from "lucide-react"

import { listWorkItems } from "@/api/work-items"
import {
  useCreateWorkItemLink,
  useDeleteWorkItemLink,
} from "@/queries/work-items"
import { WorkItemLinkType, type WorkItemLink } from "@/types/work-items"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type WorkItemLinksProps = {
  projectId: string
  workItemId: string
  outgoingLinks: WorkItemLink[]
  incomingLinks: WorkItemLink[]
}

export function WorkItemLinks({
  projectId,
  workItemId,
  outgoingLinks,
  incomingLinks,
}: WorkItemLinksProps) {
  const deleteLink = useDeleteWorkItemLink(projectId, workItemId)

  return (
    <div className="flex flex-col gap-3">
      {outgoingLinks.length + incomingLinks.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {outgoingLinks.map((link) => (
            <li
              key={link.id}
              className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm"
            >
              <LinkIcon className="size-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {link.linkType}
              </span>
              <span className="flex-1 truncate">
                #{link.targetWorkItem.code} {link.targetWorkItem.title}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={() => deleteLink.mutate(link.id)}
                aria-label="Remove link"
              >
                <XIcon className="size-3.5" />
              </Button>
            </li>
          ))}
          {incomingLinks.map((link) => (
            <li
              key={link.id}
              className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm text-muted-foreground"
            >
              <LinkIcon className="size-3.5" />
              <span className="text-xs">{link.linkType} (from)</span>
              <span className="flex-1 truncate">
                #{link.targetWorkItem.code} {link.targetWorkItem.title}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No linked work items.</p>
      )}
      <AddLinkPopover projectId={projectId} workItemId={workItemId} />
    </div>
  )
}

function AddLinkPopover({
  projectId,
  workItemId,
}: {
  projectId: string
  workItemId: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [linkType, setLinkType] = useState<WorkItemLinkType>(
    WorkItemLinkType.Related
  )
  const createLink = useCreateWorkItemLink(projectId, workItemId)

  const { data } = useQuery({
    queryKey: ["work-items", projectId, "search", search],
    queryFn: () =>
      listWorkItems(projectId, {
        page: 1,
        pageSize: 10,
        sort: "",
        searchTerm: search,
      }),
    enabled: open,
    staleTime: 30_000,
  })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="w-fit gap-1">
          <PlusIcon className="size-3.5" />
          Link work item
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="p-2">
          <Select
            value={linkType}
            onValueChange={(value) => setLinkType(value as WorkItemLinkType)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(WorkItemLinkType).map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search work items..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No work items found.</CommandEmpty>
            <CommandGroup>
              {(data?.items ?? [])
                .filter((item) => item.id !== workItemId)
                .map((item) => (
                  <CommandItem
                    key={item.id}
                    onSelect={() => {
                      createLink.mutate({
                        targetWorkItemId: item.id!,
                        linkType,
                      })
                      setOpen(false)
                    }}
                  >
                    #{item.code} {item.title}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
