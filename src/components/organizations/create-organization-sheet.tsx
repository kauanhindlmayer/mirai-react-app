import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { PlusIcon } from "lucide-react"
import { z } from "zod"

import { useCreateOrganizationMutation } from "@/queries/organizations"
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

const organizationSchema = z.object({
  name: z.string().min(1, "Name is required."),
  description: z.string(),
})

type OrganizationFormValues = z.infer<typeof organizationSchema>

export function CreateOrganizationSheet() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <PlusIcon />
          New Organization
        </Button>
      </SheetTrigger>
      <SheetContent>
        {open ? <CreateOrganizationForm onDone={() => setOpen(false)} /> : null}
      </SheetContent>
    </Sheet>
  )
}

function CreateOrganizationForm({ onDone }: { onDone: () => void }) {
  const form = useForm<OrganizationFormValues>({
    defaultValues: { name: "", description: "" },
    resolver: zodResolver(organizationSchema),
  })

  const mutation = useCreateOrganizationMutation()

  return (
    <>
      <SheetHeader>
        <SheetTitle>Create organization</SheetTitle>
        <SheetDescription>
          Organizations group your projects and teams.
        </SheetDescription>
      </SheetHeader>
      <form
        id="create-organization-form"
        className="px-4"
        onSubmit={form.handleSubmit((values) =>
          mutation.mutate(values, { onSuccess: onDone })
        )}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="org-name">Name</FieldLabel>
            <Input
              id="org-name"
              aria-invalid={!!form.formState.errors.name}
              {...form.register("name")}
            />
            <FieldError errors={[form.formState.errors.name]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="org-description">Description</FieldLabel>
            <Textarea id="org-description" {...form.register("description")} />
          </Field>
        </FieldGroup>
      </form>
      <SheetFooter>
        <Button
          type="submit"
          form="create-organization-form"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? <Spinner data-icon="inline-end" /> : null}
          Create
        </Button>
        <SheetClose asChild>
          <Button variant="outline">Cancel</Button>
        </SheetClose>
      </SheetFooter>
    </>
  )
}
