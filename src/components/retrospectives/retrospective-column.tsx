import { type KeyboardEvent, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { PlusIcon } from "lucide-react"
import { z } from "zod"

import { RetrospectiveItemCard } from "@/components/retrospectives/retrospective-item"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { useCreateRetrospectiveItemMutation } from "@/queries/retrospectives"
import type { RetrospectiveColumn } from "@/types/retrospectives"

const addItemSchema = z.object({
  content: z
    .string()
    .min(3, "Content must be at least 3 characters.")
    .max(255, "Content must be at most 255 characters."),
})

type AddItemValues = z.infer<typeof addItemSchema>

type RetrospectiveColumnCardProps = {
  retrospectiveId: string
  column: RetrospectiveColumn
}

export function RetrospectiveColumnCard({
  retrospectiveId,
  column,
}: RetrospectiveColumnCardProps) {
  const [isAddingItem, setIsAddingItem] = useState(false)

  const form = useForm<AddItemValues>({
    defaultValues: { content: "" },
    resolver: zodResolver(addItemSchema),
  })

  const mutation = useCreateRetrospectiveItemMutation(retrospectiveId)

  function submitItem(values: AddItemValues) {
    mutation.mutate(
      { columnId: column.id, content: values.content },
      { onSuccess: closeForm }
    )
  }

  function closeForm() {
    setIsAddingItem(false)
    form.reset()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Escape") {
      closeForm()
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      form.handleSubmit(submitItem)()
    }
  }

  return (
    <div className="flex w-64 shrink-0 flex-col gap-2 rounded-lg border bg-muted/30 p-3">
      <h3 className="text-sm font-semibold">{column.title}</h3>

      <Button
        variant="ghost"
        size="sm"
        className="justify-start"
        onClick={() => setIsAddingItem(true)}
      >
        <PlusIcon />
        Add New Item
      </Button>

      {isAddingItem ? (
        <form
          className="flex flex-col gap-1 rounded-md border bg-card p-2"
          onSubmit={form.handleSubmit(submitItem)}
        >
          <Textarea
            autoFocus
            rows={3}
            placeholder="Write a feedback item…"
            aria-invalid={!!form.formState.errors.content}
            {...form.register("content")}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (!form.getValues("content").trim()) closeForm()
            }}
          />
          <FieldError errors={[form.formState.errors.content]} />
        </form>
      ) : null}

      <div className="flex flex-col gap-2">
        {column.items.map((item) => (
          <RetrospectiveItemCard
            key={item.id}
            retrospectiveId={retrospectiveId}
            columnId={column.id}
            item={item}
          />
        ))}
      </div>
    </div>
  )
}
