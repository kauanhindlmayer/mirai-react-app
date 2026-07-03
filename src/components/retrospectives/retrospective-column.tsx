import { type KeyboardEvent, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import { createRetrospectiveItem } from "@/api/retrospectives"
import { RetrospectiveItemCard } from "@/components/retrospectives/retrospective-item"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
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
  const queryClient = useQueryClient()

  const form = useForm<AddItemValues>({
    defaultValues: { content: "" },
    resolver: zodResolver(addItemSchema),
  })

  const mutation = useMutation({
    mutationFn: (values: AddItemValues) =>
      createRetrospectiveItem(retrospectiveId, column.id, values.content),
    onError: (error) => {
      toast.error("Failed to add item.", {
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["retrospective", retrospectiveId],
      })
      closeForm()
    },
  })

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
      form.handleSubmit((values) => mutation.mutate(values))()
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
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
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
