import { useState } from "react"
import { UserIcon, XIcon } from "lucide-react"

import { useProjectUsersQuery } from "@/queries/projects"
import {
  useAssignWorkItemMutation,
  useUnassignWorkItemMutation,
} from "@/queries/work-items"
import { useCurrentProject } from "@/hooks/use-current-project"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import type { AssigneeResponse, ProjectUserResponse } from "@/types/work-items"
import { getAvatarUrl } from "@/lib/get-avatar-url"
import { getInitials } from "@/lib/utils"
import { useWorkItemContext } from "@/components/work-items/work-item-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

type WorkItemAssigneePickerProps = {
  assignee?: AssigneeResponse
}

export function WorkItemAssigneePicker({
  assignee,
}: WorkItemAssigneePickerProps) {
  const { projectId, workItemId } = useWorkItemContext()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search)
  const { project } = useCurrentProject()
  const assignWorkItem = useAssignWorkItemMutation(projectId, workItemId)
  const unassignWorkItem = useUnassignWorkItemMutation(projectId, workItemId)

  const { data } = useProjectUsersQuery(
    project?.organizationId,
    projectId,
    debouncedSearch,
    undefined,
    undefined,
    { enabled: open && !!project, staleTime: 30_000 }
  )

  function handleSelect(user?: ProjectUserResponse) {
    if (user) {
      assignWorkItem.mutate(user.id)
    } else {
      unassignWorkItem.mutate()
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-md px-1.5 py-1 text-left text-sm hover:bg-accent"
        >
          {assignee ? (
            <>
              <Avatar className="size-6">
                <AvatarImage
                  src={getAvatarUrl(assignee.imageUrl)}
                  alt={assignee.fullName}
                />
                <AvatarFallback className="text-[0.6rem]">
                  {getInitials(assignee.fullName)}
                </AvatarFallback>
              </Avatar>
              {assignee.fullName}
            </>
          ) : (
            <>
              <span className="flex size-6 items-center justify-center rounded-full border border-dashed text-muted-foreground">
                <UserIcon className="size-3.5" />
              </span>
              <span className="text-muted-foreground">Unassigned</span>
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search people..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No users found.</CommandEmpty>
            <CommandGroup>
              {assignee ? (
                <CommandItem onSelect={() => handleSelect(undefined)}>
                  <XIcon className="size-3.5 text-muted-foreground" />
                  Unassign
                </CommandItem>
              ) : null}
              {(data?.items ?? []).map((user) => (
                <CommandItem key={user.id} onSelect={() => handleSelect(user)}>
                  <Avatar className="size-5">
                    <AvatarImage
                      src={getAvatarUrl(user.imageUrl)}
                      alt={user.fullName}
                    />
                    <AvatarFallback className="text-[0.55rem]">
                      {getInitials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  {user.fullName}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
