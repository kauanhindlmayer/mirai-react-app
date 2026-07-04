import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { SettingsIcon, TrashIcon } from "lucide-react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
  useCreateColumnMutation,
  useDeleteColumnMutation,
} from "@/queries/boards"
import type { Column } from "@/types/boards"

type BoardSettingsSheetProps = {
  boardId: string
  columns: Column[]
}

export function BoardSettingsSheet({
  boardId,
  columns,
}: BoardSettingsSheetProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <SettingsIcon />
          Board settings
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Columns</SheetTitle>
          <SheetDescription>
            Columns visualize the flow of work across the board.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4">
          <ul className="flex flex-col gap-1">
            {columns.map((column) => (
              <li
                key={column.id}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <span>
                  {column.name}
                  {column.isDefault ? (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (default)
                    </span>
                  ) : null}
                </span>
                {!column.isDefault && column.totalCardCount === 0 ? (
                  <DeleteColumnButton boardId={boardId} columnId={column.id} />
                ) : null}
              </li>
            ))}
          </ul>
          <CreateColumnForm boardId={boardId} />
        </div>
      </SheetContent>
    </Sheet>
  )
}

function DeleteColumnButton({
  boardId,
  columnId,
}: {
  boardId: string
  columnId: string
}) {
  const mutation = useDeleteColumnMutation(boardId)

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7"
      onClick={() => mutation.mutate(columnId)}
      disabled={mutation.isPending}
      aria-label="Delete column"
    >
      <TrashIcon className="size-3.5" />
    </Button>
  )
}

const columnSchema = z.object({
  name: z.string().min(1, "Name is required."),
  wipLimit: z.string(),
  definitionOfDone: z.string(),
})

type ColumnFormValues = z.infer<typeof columnSchema>

function CreateColumnForm({ boardId }: { boardId: string }) {
  const form = useForm<ColumnFormValues>({
    defaultValues: { name: "", wipLimit: "", definitionOfDone: "" },
    resolver: zodResolver(columnSchema),
  })

  const mutation = useCreateColumnMutation(boardId)

  function handleSubmit(values: ColumnFormValues) {
    mutation.mutate(
      {
        name: values.name,
        position: 1,
        wipLimit: values.wipLimit ? Number(values.wipLimit) : undefined,
        definitionOfDone: values.definitionOfDone || undefined,
      },
      {
        onSuccess: () => {
          form.reset()
        },
      }
    )
  }

  return (
    <form
      className="flex flex-col gap-3 border-t pt-4"
      onSubmit={form.handleSubmit(handleSubmit)}
    >
      <h4 className="text-sm font-medium">Add column</h4>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="column-name">Name</FieldLabel>
          <Input
            id="column-name"
            aria-invalid={!!form.formState.errors.name}
            {...form.register("name")}
          />
          <FieldError errors={[form.formState.errors.name]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="column-wip-limit">WIP limit</FieldLabel>
          <Input
            id="column-wip-limit"
            type="number"
            min={0}
            {...form.register("wipLimit")}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="column-definition-of-done">
            Definition of done
          </FieldLabel>
          <Textarea
            id="column-definition-of-done"
            {...form.register("definitionOfDone")}
          />
        </Field>
        <Field>
          <Button type="submit" disabled={mutation.isPending} className="w-fit">
            {mutation.isPending ? <Spinner data-icon="inline-end" /> : null}
            Add column
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
