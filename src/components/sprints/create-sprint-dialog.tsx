import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { PlusIcon } from "lucide-react"
import { z } from "zod"

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
import { useCreateSprintMutation } from "@/queries/sprints"

const sprintSchema = z
  .object({
    name: z.string().min(1, "Name is required."),
    startDate: z.string().min(1, "Start date is required."),
    endDate: z.string().min(1, "End date is required."),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after the start date.",
    path: ["endDate"],
  })

type SprintFormValues = z.infer<typeof sprintSchema>

export function CreateSprintDialog({ teamId }: { teamId: string }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusIcon />
          New Sprint
        </Button>
      </DialogTrigger>
      <DialogContent>
        {open ? (
          <CreateSprintForm teamId={teamId} onDone={() => setOpen(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function CreateSprintForm({
  teamId,
  onDone,
}: {
  teamId: string
  onDone: () => void
}) {
  const form = useForm<SprintFormValues>({
    defaultValues: { name: "", startDate: "", endDate: "" },
    resolver: zodResolver(sprintSchema),
  })

  const mutation = useCreateSprintMutation(teamId)

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create sprint</DialogTitle>
        <DialogDescription>
          Sprints group work items into a time-boxed iteration.
        </DialogDescription>
      </DialogHeader>
      <form
        id="create-sprint-form"
        onSubmit={form.handleSubmit((values) =>
          mutation.mutate(
            {
              name: values.name,
              startDate: new Date(values.startDate),
              endDate: new Date(values.endDate),
            },
            { onSuccess: onDone }
          )
        )}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="sprint-name">Name</FieldLabel>
            <Input
              id="sprint-name"
              aria-invalid={!!form.formState.errors.name}
              {...form.register("name")}
            />
            <FieldError errors={[form.formState.errors.name]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="sprint-start-date">Start date</FieldLabel>
            <Input
              id="sprint-start-date"
              type="date"
              aria-invalid={!!form.formState.errors.startDate}
              {...form.register("startDate")}
            />
            <FieldError errors={[form.formState.errors.startDate]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="sprint-end-date">End date</FieldLabel>
            <Input
              id="sprint-end-date"
              type="date"
              aria-invalid={!!form.formState.errors.endDate}
              {...form.register("endDate")}
            />
            <FieldError errors={[form.formState.errors.endDate]} />
          </Field>
        </FieldGroup>
      </form>
      <DialogFooter>
        <Button
          type="submit"
          form="create-sprint-form"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? <Spinner data-icon="inline-end" /> : null}
          Create
        </Button>
      </DialogFooter>
    </>
  )
}
