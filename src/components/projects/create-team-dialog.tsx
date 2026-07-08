import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { useCreateTeamMutation } from "@/queries/teams"
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
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"

const teamSchema = z.object({
  name: z.string().min(1, "Name is required."),
  description: z.string(),
})

type TeamFormValues = z.infer<typeof teamSchema>

type CreateTeamDialogProps = {
  projectId: string
}

export function CreateTeamDialog({ projectId }: CreateTeamDialogProps) {
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
