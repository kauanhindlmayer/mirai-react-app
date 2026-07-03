import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import { createTag } from "@/api/tags"
import { TagColorPicker } from "@/components/tags/tag-color-picker"
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
import { Spinner } from "@/components/ui/spinner"

const tagSchema = z.object({
  name: z.string().min(1, "Name is required."),
  description: z.string(),
  color: z.string().min(1, "Color is required."),
})

type TagFormValues = z.infer<typeof tagSchema>

export function CreateTagPopover({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const form = useForm<TagFormValues>({
    defaultValues: { name: "", description: "", color: "#2a78d6" },
    resolver: zodResolver(tagSchema),
  })

  const mutation = useMutation({
    mutationFn: (values: TagFormValues) => createTag(projectId, values),
    onError: (error) => {
      toast.error("Failed to create tag.", {
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", projectId] })
      toast.success("Tag created.")
      form.reset()
      setOpen(false)
    },
  })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm">
          <PlusIcon />
          New Tag
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <form
          className="flex flex-col gap-3"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <FieldGroup>
            <Field orientation="horizontal">
              <TagColorPicker
                color={form.watch("color")}
                onChange={(color) => form.setValue("color", color)}
              />
              <div className="flex-1">
                <Input
                  placeholder="Tag name"
                  aria-invalid={!!form.formState.errors.name}
                  {...form.register("name")}
                />
              </div>
            </Field>
            <FieldError errors={[form.formState.errors.name]} />
            <Field>
              <FieldLabel htmlFor="tag-description">Description</FieldLabel>
              <Input id="tag-description" {...form.register("description")} />
            </Field>
            <Field>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="w-full"
              >
                {mutation.isPending ? <Spinner data-icon="inline-end" /> : null}
                Create
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </PopoverContent>
    </Popover>
  )
}
