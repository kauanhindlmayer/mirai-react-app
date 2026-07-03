import { type ReactNode, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { z } from "zod"

import { createProject, updateProject } from "@/api/projects"
import type { Project } from "@/types/projects"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const projectSchema = z.object({
  name: z.string().min(1, "Name is required."),
  description: z.string(),
})

type ProjectFormValues = z.infer<typeof projectSchema>

type ProjectFormSheetProps = {
  organizationId: string
  project?: Project
  trigger: ReactNode
}

export function ProjectFormSheet({
  organizationId,
  project,
  trigger,
}: ProjectFormSheetProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent>
        {open ? (
          <ProjectForm
            organizationId={organizationId}
            project={project}
            onDone={() => setOpen(false)}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function ProjectForm({
  organizationId,
  project,
  onDone,
}: {
  organizationId: string
  project?: Project
  onDone: () => void
}) {
  const queryClient = useQueryClient()
  const isEditing = !!project

  const form = useForm<ProjectFormValues>({
    defaultValues: {
      name: project?.name ?? "",
      description: project?.description ?? "",
    },
    resolver: zodResolver(projectSchema),
  })

  const mutation = useMutation({
    mutationFn: (values: ProjectFormValues) =>
      isEditing
        ? updateProject({ id: project.id, organizationId, ...values })
        : createProject({ organizationId, ...values }),
    onError: (error) => {
      toast.error(
        isEditing ? "Failed to update project." : "Failed to create project.",
        {
          description:
            error instanceof Error ? error.message : "Something went wrong.",
        }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", organizationId] })
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: ["project", project.id] })
      }
      toast.success(isEditing ? "Project updated." : "Project created.")
      onDone()
    },
  })

  return (
    <>
      <SheetHeader>
        <SheetTitle>{isEditing ? "Edit project" : "Create project"}</SheetTitle>
        <SheetDescription>
          {isEditing
            ? "Update this project's name and description."
            : "Projects contain teams, boards, and work items."}
        </SheetDescription>
      </SheetHeader>
      <form
        id="project-form"
        className="px-4"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="project-name">Name</FieldLabel>
            <Input
              id="project-name"
              aria-invalid={!!form.formState.errors.name}
              {...form.register("name")}
            />
            <FieldError errors={[form.formState.errors.name]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="project-description">Description</FieldLabel>
            <Textarea
              id="project-description"
              {...form.register("description")}
            />
          </Field>
        </FieldGroup>
      </form>
      <SheetFooter>
        <Button type="submit" form="project-form" disabled={mutation.isPending}>
          {mutation.isPending ? <Spinner data-icon="inline-end" /> : null}
          {isEditing ? "Save changes" : "Create"}
        </Button>
        <SheetClose asChild>
          <Button variant="outline">Cancel</Button>
        </SheetClose>
      </SheetFooter>
    </>
  )
}
