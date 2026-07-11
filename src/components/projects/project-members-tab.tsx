import { useState } from "react"

import { useCan } from "@/hooks/use-can"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useOrganizationUsersQuery } from "@/queries/organizations"
import {
  useAddUserToProjectMutation,
  useProjectUsersQuery,
  useRemoveUserFromProjectMutation,
} from "@/queries/projects"
import { useChangeProjectMemberRoleMutation } from "@/queries/roles"
import { ErrorState } from "@/components/common/error-state"
import { MemberRoleSelect } from "@/components/authorization/member-role-select"
import { RemoveMemberButton } from "@/components/authorization/remove-member-button"
import { Permission, RoleScope } from "@/types/roles"
import { getAvatarUrl } from "@/lib/get-avatar-url"
import { getInitials } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Skeleton } from "@/components/ui/skeleton"

const MEMBERS_PAGE_SIZE = 10

type ProjectMembersTabProps = {
  organizationId: string
  projectId: string
}

export function ProjectMembersTab({
  organizationId,
  projectId,
}: ProjectMembersTabProps) {
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, error, refetch } = useProjectUsersQuery(
    organizationId,
    projectId,
    "",
    page,
    MEMBERS_PAGE_SIZE
  )

  const canManageMembers = useCan(
    RoleScope.Project,
    projectId,
    Permission.ProjectManageMembers
  )
  const changeRoleMutation = useChangeProjectMemberRoleMutation(
    organizationId,
    projectId
  )
  const removeMemberMutation = useRemoveUserFromProjectMutation(
    organizationId,
    projectId
  )

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Members</h2>
        <AddProjectMemberDialog
          organizationId={organizationId}
          projectId={projectId}
        />
      </div>
      {isError ? (
        <ErrorState
          error={error}
          title="Failed to load members"
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : data && data.items.length > 0 ? (
        <ul className="flex flex-col divide-y rounded-md border">
          {data.items.map((member) => (
            <li
              key={member.id}
              className="flex items-center gap-3 px-4 py-2 text-sm"
            >
              <Avatar className="size-7">
                <AvatarImage
                  src={getAvatarUrl(member.imageUrl)}
                  alt={member.fullName}
                />
                <AvatarFallback>{getInitials(member.fullName)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col">
                <span className="font-medium">{member.fullName}</span>
                <span className="text-xs text-muted-foreground">
                  {member.email}
                </span>
              </div>
              <MemberRoleSelect
                scope={RoleScope.Project}
                roleId={member.roleId}
                roleName={member.roleName}
                canManage={canManageMembers}
                onChange={(roleId) =>
                  changeRoleMutation.mutate({ userId: member.id, roleId })
                }
              />
              {canManageMembers ? (
                <RemoveMemberButton
                  memberName={member.fullName}
                  onConfirm={() => removeMemberMutation.mutate(member.id)}
                />
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No members yet.</p>
      )}

      {data && data.totalPages > 1 ? (
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
    </div>
  )
}

function AddProjectMemberDialog({
  organizationId,
  projectId,
}: {
  organizationId: string
  projectId: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search)

  const mutation = useAddUserToProjectMutation(organizationId, projectId)

  const { data } = useOrganizationUsersQuery(
    organizationId,
    { page: 1, pageSize: 10, sort: "", searchTerm: debouncedSearch },
    projectId,
    { enabled: isOpen }
  )

  function handleSelect(userId: string) {
    mutation.mutate(userId, { onSuccess: () => setIsOpen(false) })
  }

  return (
    <>
      <Button size="sm" onClick={() => setIsOpen(true)}>
        Add member
      </Button>
      <CommandDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Add member"
        description="Search organization members to add to this project."
      >
        <CommandInput
          placeholder="Search people..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>No users found.</CommandEmpty>
          <CommandGroup>
            {(data?.items ?? []).map((user) => (
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
      </CommandDialog>
    </>
  )
}
