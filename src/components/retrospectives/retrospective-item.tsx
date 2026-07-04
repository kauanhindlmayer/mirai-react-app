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
import { useDeleteRetrospectiveItemMutation } from "@/queries/retrospectives"
import type { RetrospectiveItem } from "@/types/retrospectives"

type RetrospectiveItemCardProps = {
  retrospectiveId: string
  columnId: string
  item: RetrospectiveItem
}

export function RetrospectiveItemCard({
  retrospectiveId,
  columnId,
  item,
}: RetrospectiveItemCardProps) {
  const mutation = useDeleteRetrospectiveItemMutation(retrospectiveId)

  return (
    <div className="group relative flex flex-col gap-2 rounded-md border bg-card p-3 shadow-sm">
      <p className="w-[200px] text-sm text-wrap text-card-foreground">
        {item.content}
      </p>
      <p className="text-xs text-muted-foreground">
        {new Date(item.createdAtUtc).toLocaleString(undefined, {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 size-6 opacity-0 group-hover:opacity-100"
            aria-label="Delete item"
          >
            <TrashIcon className="size-3.5" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete item?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the item &quot;{item.content}
              &quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => mutation.mutate({ columnId, itemId: item.id })}
              disabled={mutation.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
