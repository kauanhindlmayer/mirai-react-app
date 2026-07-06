import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { useOrganizationUsersQuery } from "@/queries/organizations"
import {
  useAddUserToTeamMutation,
  useCreateTeamMutation,
  useTeamMembersQuery,
  useTeamsQuery,
} from "@/queries/teams"
import {
  useAddUserToProjectMutation,
  useProjectUsersQuery,
  useUpdateProjectMutation,
} from "@/queries/projects"
import { ErrorState } from "@/components/common/error-state"
import { useCurrentProject } from "@/hooks/use-current-project"
import type { Project } from "@/types/projects"
import type { Team } from "@/types/teams"
import { getAvatarUrl } from "@/lib/get-avatar-url"
import { getInitials } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

const MEMBERS_PAGE_SIZE = 10

export default function ProjectSettingsPage() {
  const { projectId, project, isLoading, isError, error, refetch } =
    useCurrentProject()

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold">
        {project?.name ?? "Project"} — Settings
      </h1>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="github">GitHub</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          {isError ? (
            <ErrorState
              error={error}
              title="Failed to load project"
              onRetry={() => refetch()}
            />
          ) : isLoading ? (
            <Skeleton className="h-40" />
          ) : project ? (
            <ProjectOverviewForm project={project} />
          ) : null}
        </TabsContent>
        <TabsContent value="teams">
          {projectId && project ? (
            <ProjectTeamsTab
              organizationId={project.organizationId}
              projectId={projectId}
            />
          ) : null}
        </TabsContent>
        <TabsContent value="members">
          {projectId && project ? (
            <ProjectMembersTab
              organizationId={project.organizationId}
              projectId={projectId}
            />
          ) : null}
        </TabsContent>
        <TabsContent value="github">
          <div className="flex flex-col items-start gap-2 py-4">
            <p className="text-sm text-muted-foreground">
              Connect this project to a GitHub repository.
            </p>
            <Button variant="outline" disabled>
              Connect your GitHub Account
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

const projectOverviewSchema = z.object({
  name: z.string().min(1, "Name is required."),
  description: z.string(),
})

type ProjectOverviewValues = z.infer<typeof projectOverviewSchema>

function ProjectOverviewForm({ project }: { project: Project }) {
  const form = useForm<ProjectOverviewValues>({
    defaultValues: { name: project.name, description: project.description },
    resolver: zodResolver(projectOverviewSchema),
  })

  const mutation = useUpdateProjectMutation()

  function onSubmit(values: ProjectOverviewValues) {
    mutation.mutate({
      id: project.id,
      organizationId: project.organizationId,
      ...values,
    })
  }

  return (
    <form
      className="flex max-w-md flex-col gap-4 py-4"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="settings-project-name">Name</FieldLabel>
          <Input
            id="settings-project-name"
            aria-invalid={!!form.formState.errors.name}
            {...form.register("name")}
          />
          <FieldError errors={[form.formState.errors.name]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="settings-project-description">
            Description
          </FieldLabel>
          <Textarea
            id="settings-project-description"
            {...form.register("description")}
          />
        </Field>
        <Field>
          <Button type="submit" disabled={mutation.isPending} className="w-fit">
            {mutation.isPending ? <Spinner data-icon="inline-end" /> : null}
            Save changes
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}

function ProjectTeamsTab({
  organizationId,
  projectId,
}: {
  organizationId: string
  projectId: string
}) {
  const {
    data: teams = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useTeamsQuery(projectId)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Teams</h2>
        <CreateTeamDialog projectId={projectId} />
      </div>
      {isError ? (
        <ErrorState
          error={error}
          title="Failed to load teams"
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : teams.length > 0 ? (
        <ul className="flex flex-col divide-y rounded-md border">
          {teams.map((team) => (
            <li key={team.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-muted"
                onClick={() => setSelectedTeam(team)}
              >
                <span>{team.name}</span>
                <Badge variant="outline">
                  {team.memberCount}{" "}
                  {team.memberCount === 1 ? "member" : "members"}
                </Badge>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No teams yet.</p>
      )}
      {selectedTeam ? (
        <TeamMembersDialog
          organizationId={organizationId}
          projectId={projectId}
          team={selectedTeam}
          open={!!selectedTeam}
          onOpenChange={(open) => {
            if (!open) setSelectedTeam(null)
          }}
        />
      ) : null}
    </div>
  )
}

const teamSchema = z.object({
  name: z.string().min(1, "Name is required."),
  description: z.string(),
})

type TeamFormValues = z.infer<typeof teamSchema>

function CreateTeamDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">New Team</Button>
      </DialogTrigger>
      <DialogContent>
        {open ? (
          <CreateTeamForm projectId={projectId} onDone={() => setOpen(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function CreateTeamForm({
  projectId,
  onDone,
}: {
  projectId: string
  onDone: () => void
}) {
  const form = useForm<TeamFormValues>({
    defaultValues: { name: "", description: "" },
    resolver: zodResolver(teamSchema),
  })

  const mutation = useCreateTeamMutation(projectId)

  function onSubmit(values: TeamFormValues) {
    mutation.mutate(values, { onSuccess: onDone })
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create team</DialogTitle>
        <DialogDescription>
          Teams work through boards, backlogs, and sprints.
        </DialogDescription>
      </DialogHeader>
      <form id="create-team-form" onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="team-name">Name</FieldLabel>
            <Input
              id="team-name"
              aria-invalid={!!form.formState.errors.name}
              {...form.register("name")}
            />
            <FieldError errors={[form.formState.errors.name]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="team-description">Description</FieldLabel>
            <Textarea id="team-description" {...form.register("description")} />
          </Field>
        </FieldGroup>
      </form>
      <DialogFooter>
        <Button
          type="submit"
          form="create-team-form"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? <Spinner data-icon="inline-end" /> : null}
          Create
        </Button>
      </DialogFooter>
    </>
  )
}

function TeamMembersDialog({
  organizationId,
  projectId,
  team,
  open,
  onOpenChange,
}: {
  organizationId: string
  projectId: string
  team: Team
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, error, refetch } = useTeamMembersQuery(
    projectId,
    team.id,
    page,
    MEMBERS_PAGE_SIZE
  )

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
                    <span className="font-medium">{member.name}</span>
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
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const mutation = useAddUserToTeamMutation(projectId, teamId)

  const { data } = useProjectUsersQuery(
    organizationId,
    projectId,
    search,
    1,
    10,
    { enabled: open }
  )

  const candidates = data?.items ?? []

  function handleSelect(userId: string) {
    mutation.mutate(userId, { onSuccess: () => setOpen(false) })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
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

function ProjectMembersTab({
  organizationId,
  projectId,
}: {
  organizationId: string
  projectId: string
}) {
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, error, refetch } = useProjectUsersQuery(
    organizationId,
    projectId,
    "",
    page,
    MEMBERS_PAGE_SIZE
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
              <div className="flex flex-col">
                <span className="font-medium">{member.fullName}</span>
                <span className="text-xs text-muted-foreground">
                  {member.email}
                </span>
              </div>
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
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const mutation = useAddUserToProjectMutation(organizationId, projectId)

  const { data } = useOrganizationUsersQuery(
    organizationId,
    { page: 1, pageSize: 10, sort: "", searchTerm: search },
    projectId,
    { enabled: open }
  )

  function handleSelect(userId: string) {
    mutation.mutate(userId, { onSuccess: () => setOpen(false) })
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        Add member
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
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
