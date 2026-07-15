import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { SprintFormFields } from "@/components/sprints/sprint-form"
import {
  sprintSchema,
  type SprintFormValues,
} from "@/components/sprints/sprint-form-schema"
import { toUnavailableRanges } from "@/components/sprints/sprint-dates"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { useUpdateSprintMutation } from "@/queries/sprints"
import type { Sprint } from "@/types/sprints"

type EditSprintDialogProps = {
  teamId: string
  sprint: Sprint
  sprints: Sprint[]
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export function EditSprintDialog({
  teamId,
  sprint,
  sprints,
  isOpen,
  onOpenChange,
}: EditSprintDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        {isOpen ? (
          <EditSprintForm
            teamId={teamId}
            sprint={sprint}
            sprints={sprints}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function EditSprintForm({
  teamId,
  sprint,
  sprints,
  onDone,
}: {
  teamId: string
  sprint: Sprint
  sprints: Sprint[]
  onDone: () => void
}) {
  const form = useForm<SprintFormValues>({
    defaultValues: {
      name: sprint.name,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
    },
    resolver: zodResolver(sprintSchema),
  })

  const mutation = useUpdateSprintMutation(teamId)

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit sprint</DialogTitle>
        <DialogDescription>
          Change the sprint's name or the dates it runs between. Days already
          covered by another sprint cannot be picked.
        </DialogDescription>
      </DialogHeader>
      <form
        id="edit-sprint-form"
        onSubmit={form.handleSubmit((values) =>
          mutation.mutate(
            { sprintId: sprint.id, request: values },
            { onSuccess: onDone }
          )
        )}
      >
        <SprintFormFields
          form={form}
          idPrefix="edit-sprint"
          unavailableRanges={toUnavailableRanges(sprints, sprint.id)}
        />
      </form>
      <DialogFooter>
        <Button
          type="submit"
          form="edit-sprint-form"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? <Spinner data-icon="inline-end" /> : null}
          Save
        </Button>
      </DialogFooter>
    </>
  )
}
