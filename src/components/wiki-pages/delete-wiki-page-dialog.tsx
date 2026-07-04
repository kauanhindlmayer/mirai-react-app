import { TrashIcon } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useDeleteWikiPageMutation } from "@/queries/wiki-pages"

type DeleteWikiPageDialogProps = {
  projectId: string
  wikiPageId: string
  title: string
  onDeleted: () => void
}

export function DeleteWikiPageDialog({
  projectId,
  wikiPageId,
  title,
  onDeleted,
}: DeleteWikiPageDialogProps) {
  const mutation = useDeleteWikiPageMutation(projectId)

  function handleDelete() {
    mutation.mutate(wikiPageId, { onSuccess: onDeleted })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <TrashIcon />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &quot;{title}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this wiki page. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={mutation.isPending}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
