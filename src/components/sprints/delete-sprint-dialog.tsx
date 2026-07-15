import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"
import { useDeleteSprintMutation } from "@/queries/sprints"
import type { Sprint } from "@/types/sprints"

type DeleteSprintDialogProps = {
  teamId: string
  sprint: Sprint
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onDeleted: () => void
}

function describeConsequence(sprint: Sprint): string {
  if (sprint.workItemCount === 0) {
    return `${sprint.name} will be permanently deleted. This cannot be undone.`
  }

  const workItems =
    sprint.workItemCount === 1
      ? "1 work item"
      : `${sprint.workItemCount} work items`

  return `${workItems} will be returned to the backlog, and ${sprint.name} will be permanently deleted. This cannot be undone.`
}

export function DeleteSprintDialog({
  teamId,
  sprint,
  isOpen,
  onOpenChange,
  onDeleted,
}: DeleteSprintDialogProps) {
  const mutation = useDeleteSprintMutation(teamId)

  function handleDelete() {
    mutation.mutate(sprint.id, {
      onSuccess: () => {
        onDeleted()
        onOpenChange(false)
      },
    })
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete sprint?</AlertDialogTitle>
          <AlertDialogDescription>
            {describeConsequence(sprint)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={mutation.isPending}
            onClick={(event) => {
              event.preventDefault()
              handleDelete()
            }}
          >
            {mutation.isPending ? <Spinner data-icon="inline-end" /> : null}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
