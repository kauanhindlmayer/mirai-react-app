import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { z } from "zod"

import { createTeam, listTeams } from "@/api/teams"
import { updateProject } from "@/api/projects"
import { ErrorState } from "@/components/error-state"
import { useProjectContext } from "@/hooks/use-project-context"
import type { Project } from "@/types/projects"
import { Button } from "@/components/ui/button"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

export default function ProjectSettingsPage() {
  const { projectId, project, isLoading, isError, error, refetch } =
    useProjectContext()

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold">
        {project?.name ?? "Project"} — Settings
      </h1>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
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
          {projectId ? <ProjectTeamsTab projectId={projectId} /> : null}
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
  const queryClient = useQueryClient()
  const form = useForm<ProjectOverviewValues>({
    defaultValues: { name: project.name, description: project.description },
    resolver: zodResolver(projectOverviewSchema),
  })

  const mutation = useMutation({
    mutationFn: (values: ProjectOverviewValues) =>
      updateProject({
        id: project.id,
        organizationId: project.organizationId,
        ...values,
      }),
    onError: (error) => {
      toast.error("Failed to update project.", {
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", project.id] })
      queryClient.invalidateQueries({
        queryKey: ["projects", project.organizationId],
      })
      toast.success("Project updated.")
    },
  })

  return (
    <form
      className="flex max-w-md flex-col gap-4 py-4"
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
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

function ProjectTeamsTab({ projectId }: { projectId: string }) {
  const teamsQuery = useQuery({
    queryKey: ["teams", projectId],
    queryFn: () => listTeams(projectId),
    staleTime: 60_000,
    placeholderData: [],
  })

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Teams</h2>
        <CreateTeamDialog projectId={projectId} />
      </div>
      {teamsQuery.isError ? (
        <ErrorState
          error={teamsQuery.error}
          title="Failed to load teams"
          onRetry={() => teamsQuery.refetch()}
        />
      ) : teamsQuery.isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : teamsQuery.data && teamsQuery.data.length > 0 ? (
        <ul className="flex flex-col divide-y rounded-md border">
          {teamsQuery.data.map((team) => (
            <li key={team.id} className="px-4 py-2 text-sm">
              {team.name}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No teams yet.</p>
      )}
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
  const queryClient = useQueryClient()
  const form = useForm<TeamFormValues>({
    defaultValues: { name: "", description: "" },
    resolver: zodResolver(teamSchema),
  })

  const mutation = useMutation({
    mutationFn: (values: TeamFormValues) => createTeam(projectId, values),
    onError: (error) => {
      toast.error("Failed to create team.", {
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams", projectId] })
      toast.success("Team created.")
      onDone()
    },
  })

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create team</DialogTitle>
        <DialogDescription>
          Teams work through boards, backlogs, and sprints.
        </DialogDescription>
      </DialogHeader>
      <form
        id="create-team-form"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
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
