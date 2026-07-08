import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { useUpdateProjectMutation } from "@/queries/projects"
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

const projectOverviewSchema = z.object({
  name: z.string().min(1, "Name is required."),
  description: z.string(),
})

type ProjectOverviewValues = z.infer<typeof projectOverviewSchema>

type ProjectOverviewTabProps = {
  project: Project
}

export function ProjectOverviewTab({ project }: ProjectOverviewTabProps) {
  const form = useForm<ProjectOverviewValues>({
    defaultValues: { name: project.name, description: project.description },
    resolver: zodResolver(projectOverviewSchema),
  })

  const mutation = useUpdateProjectMutation()

  function onSubmit(values: ProjectOverviewValues) {
    mutation.mutate({
      id: project.id,
      organizationId: project.organizationId,
      ...values,
    })
  }

  return (
    <form
      className="flex max-w-md flex-col gap-4 py-4"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="settings-project-name">Name</FieldLabel>
          <Input
            id="settings-project-name"
            aria-invalid={!!form.formState.errors.name}
            {...form.register("name")}
          />
          <FieldError errors={[form.formState.errors.name]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="settings-project-description">
            Description
          </FieldLabel>
          <Textarea
            id="settings-project-description"
            {...form.register("description")}
          />
        </Field>
        <Field>
          <Button type="submit" disabled={mutation.isPending} className="w-fit">
            {mutation.isPending ? <Spinner data-icon="inline-end" /> : null}
            Save changes
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
