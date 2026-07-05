import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useQueryClient } from "@tanstack/react-query"
import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { InfoIcon, PlusIcon } from "lucide-react"
import { z } from "zod"

import { BoardCard } from "@/components/boards/board-card"
import { Button } from "@/components/ui/button"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { boardQueryKey } from "@/queries/boards"
import { useCreateWorkItemMutation } from "@/queries/work-items"
import type { Column } from "@/types/boards"
import { WorkItemType } from "@/types/work-items"

type BoardColumnProps = {
  column: Column
  projectId: string
  teamId: string
  boardId: string
  onOpenWorkItem: (workItemId: string) => void
}

export function BoardColumn({
  column,
  projectId,
  teamId,
  boardId,
  onOpenWorkItem,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { columnId: column.id },
  })

  const isOverWipLimit =
    !!column.wipLimit && column.totalCardCount > column.wipLimit

  return (
    <div className="flex w-72 shrink-0 flex-col gap-3 rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-semibold">{column.name}</h3>
          {column.definitionOfDone ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="size-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>{column.definitionOfDone}</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
        {column.wipLimit ? (
          <span
            className={cn(
              "text-xs font-medium",
              isOverWipLimit ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {column.totalCardCount}/{column.wipLimit}
          </span>
        ) : null}
      </div>

      {column.isDefault ? (
        <QuickAddWorkItem
          projectId={projectId}
          teamId={teamId}
          boardId={boardId}
        />
      ) : null}

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-16 flex-col gap-2 rounded-md",
          isOver && "bg-accent/50"
        )}
      >
        <SortableContext
          items={column.cards.map((card) => card.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.cards.map((card) => (
            <BoardCard key={card.id} card={card} onOpen={onOpenWorkItem} />
          ))}
        </SortableContext>
      </div>

      {column.hasMoreCards ? (
        <p className="text-center text-xs text-muted-foreground">
          {column.totalCardCount - column.cards.length} more item
          {column.totalCardCount - column.cards.length !== 1 ? "s" : ""}
        </p>
      ) : null}
    </div>
  )
}

const quickAddSchema = z.object({
  title: z.string().min(1, "Title is required."),
  type: z.enum(WorkItemType),
})

type QuickAddValues = z.infer<typeof quickAddSchema>

function QuickAddWorkItem({
  projectId,
  teamId,
  boardId,
}: {
  projectId: string
  teamId: string
  boardId: string
}) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const form = useForm<QuickAddValues>({
    defaultValues: { title: "", type: WorkItemType.UserStory },
    resolver: zodResolver(quickAddSchema),
  })

  const createWorkItemMutation = useCreateWorkItemMutation(projectId)

  function handleSubmit(values: QuickAddValues) {
    createWorkItemMutation.mutate(
      { ...values, assignedTeamId: teamId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: boardQueryKey(boardId) })
          form.reset()
          setOpen(false)
        },
      }
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <PlusIcon />
          New item
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <form
          className="flex flex-col gap-3"
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="quick-add-type">Type</FieldLabel>
              <Select
                value={form.watch("type")}
                onValueChange={(value) =>
                  form.setValue("type", value as WorkItemType)
                }
              >
                <SelectTrigger id="quick-add-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(WorkItemType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="quick-add-title">Title</FieldLabel>
              <Input
                id="quick-add-title"
                aria-invalid={!!form.formState.errors.title}
                {...form.register("title")}
              />
              <FieldError errors={[form.formState.errors.title]} />
            </Field>
            <Field>
              <Button
                type="submit"
                disabled={createWorkItemMutation.isPending}
                className="w-full"
              >
                {createWorkItemMutation.isPending ? (
                  <Spinner data-icon="inline-end" />
                ) : null}
                Add to Top
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </PopoverContent>
    </Popover>
  )
}
