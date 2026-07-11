import { useState } from "react"

import { useCan } from "@/hooks/use-can"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useProjectUsersQuery } from "@/queries/projects"
import {
  useAddUserToTeamMutation,
  useRemoveUserFromTeamMutation,
  useTeamMembersQuery,
} from "@/queries/teams"
import { useChangeTeamMemberRoleMutation } from "@/queries/roles"
import { ErrorState } from "@/components/common/error-state"
import { MemberRoleSelect } from "@/components/authorization/member-role-select"
import { RemoveMemberButton } from "@/components/authorization/remove-member-button"
import type { Team } from "@/types/teams"
import { Permission, RoleScope } from "@/types/roles"
import { getAvatarUrl } from "@/lib/get-avatar-url"
import { getInitials } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"

const MEMBERS_PAGE_SIZE = 10

type TeamMembersDialogProps = {
  organizationId: string
  projectId: string
  team: Team
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TeamMembersDialog({
  organizationId,
  projectId,
  team,
  open,
  onOpenChange,
}: TeamMembersDialogProps) {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, error, refetch } = useTeamMembersQuery(
    projectId,
    team.id,
    page,
    MEMBERS_PAGE_SIZE
  )

  const canManageMembers = useCan(
    RoleScope.Team,
    team.id,
    Permission.TeamManageMembers
  )
  const changeRoleMutation = useChangeTeamMemberRoleMutation(projectId, team.id)
  const removeMemberMutation = useRemoveUserFromTeamMutation(projectId, team.id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{team.name}</DialogTitle>
          <DialogDescription>Manage who's on this team.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Members</h3>
            <AddTeamMemberDialog
              organizationId={organizationId}
              projectId={projectId}
              teamId={team.id}
            />
          </div>
          {isError ? (
            <ErrorState
              error={error}
              title="Failed to load team members"
              onRetry={() => refetch()}
            />
          ) : isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : data && data.items.length > 0 ? (
            <>
              <ul className="flex flex-col divide-y rounded-md border">
                {data.items.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center gap-3 px-4 py-2 text-sm"
                  >
                    <Avatar className="size-7">
                      <AvatarFallback>
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 font-medium">{member.name}</span>
                    <MemberRoleSelect
                      scope={RoleScope.Team}
                      roleId={member.roleId}
                      roleName={member.roleName}
                      canManage={canManageMembers}
                      onChange={(roleId) =>
                        changeRoleMutation.mutate({
                          userId: member.id,
                          roleId,
                        })
                      }
                    />
                    {canManageMembers ? (
                      <RemoveMemberButton
                        memberName={member.name}
                        onConfirm={() => removeMemberMutation.mutate(member.id)}
                      />
                    ) : null}
                  </li>
                ))}
              </ul>
              {data.totalPages > 1 ? (
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!data.hasPreviousPage}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Page {data.page} of {data.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!data.hasNextPage}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No members yet.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AddTeamMemberDialog({
  organizationId,
  projectId,
  teamId,
}: {
  organizationId: string
  projectId: string
  teamId: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search)

  const mutation = useAddUserToTeamMutation(projectId, teamId)

  const { data } = useProjectUsersQuery(
    organizationId,
    projectId,
    debouncedSearch,
    1,
    10,
    { enabled: isOpen }
  )

  const candidates = data?.items ?? []

  function handleSelect(userId: string) {
    mutation.mutate(userId, { onSuccess: () => setIsOpen(false) })
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button size="sm">Add member</Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search people..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No users found.</CommandEmpty>
            <CommandGroup>
              {candidates.map((user) => (
                <CommandItem
                  key={user.id}
                  disabled={mutation.isPending}
                  onSelect={() => handleSelect(user.id)}
                >
                  <Avatar className="size-5">
                    <AvatarImage
                      src={getAvatarUrl(user.imageUrl)}
                      alt={user.fullName}
                    />
                    <AvatarFallback className="text-[0.55rem]">
                      {getInitials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span>{user.fullName}</span>
                    <span className="text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
