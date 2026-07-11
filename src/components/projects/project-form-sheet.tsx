import { type ReactNode, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import {
  useCreateProjectMutation,
  useUpdateProjectMutation,
} from "@/queries/projects"
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
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent>
        {isOpen ? (
          <ProjectForm
            organizationId={organizationId}
            project={project}
            onDone={() => setIsOpen(false)}
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
  const isEditing = !!project

  const form = useForm<ProjectFormValues>({
    defaultValues: {
      name: project?.name ?? "",
      description: project?.description ?? "",
    },
    resolver: zodResolver(projectSchema),
  })

  const createProject = useCreateProjectMutation()
  const updateProject = useUpdateProjectMutation()
  const mutation = isEditing ? updateProject : createProject

  function onSubmit(values: ProjectFormValues) {
    if (isEditing) {
      updateProject.mutate(
        { id: project.id, organizationId, ...values },
        { onSuccess: onDone }
      )
    } else {
      createProject.mutate({ organizationId, ...values }, { onSuccess: onDone })
    }
  }

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
        onSubmit={form.handleSubmit(onSubmit)}
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
