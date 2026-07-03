import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { UserIcon, XIcon } from "lucide-react"

import { getProjectUsers } from "@/api/projects"
import { useUpdateWorkItem } from "@/queries/work-items"
import { useProjectContext } from "@/hooks/use-project-context"
import type { AssigneeResponse, ProjectUserResponse } from "@/types/work-items"
import { getInitials } from "@/lib/utils"
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
  projectId: string
  workItemId: string
  assignee?: AssigneeResponse
}

export function WorkItemAssigneePicker({
  projectId,
  workItemId,
  assignee,
}: WorkItemAssigneePickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const { project } = useProjectContext()
  const updateWorkItem = useUpdateWorkItem(projectId, workItemId)

  const usersQuery = useQuery({
    queryKey: ["project-users", project?.organizationId, projectId, search],
    queryFn: () => getProjectUsers(project!.organizationId, projectId, search),
    enabled: open && !!project,
    staleTime: 30_000,
  })

  function handleSelect(user?: ProjectUserResponse) {
    updateWorkItem.mutate({ assignee: user })
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
                <AvatarImage src={assignee.imageUrl} alt={assignee.fullName} />
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
              {(usersQuery.data?.items ?? []).map((user) => (
                <CommandItem key={user.id} onSelect={() => handleSelect(user)}>
                  <Avatar className="size-5">
                    <AvatarImage src={user.imageUrl} alt={user.fullName} />
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
