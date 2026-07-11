import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { useAddUserToOrganizationMutation } from "@/queries/organizations"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

const inviteSchema = z.object({
  email: z.email("Enter a valid email address."),
})

type InviteFormValues = z.infer<typeof inviteSchema>

type InviteUserDialogProps = {
  organizationId: string
}

export function InviteUserDialog({ organizationId }: InviteUserDialogProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Invite member</Button>
      </DialogTrigger>
      <DialogContent>
        {isOpen ? (
          <InviteUserForm
            organizationId={organizationId}
            onDone={() => setIsOpen(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function InviteUserForm({
  organizationId,
  onDone,
}: {
  organizationId: string
  onDone: () => void
}) {
  const form = useForm<InviteFormValues>({
    defaultValues: { email: "" },
    resolver: zodResolver(inviteSchema),
  })

  const mutation = useAddUserToOrganizationMutation(organizationId)

  return (
    <>
      <DialogHeader>
        <DialogTitle>Invite member</DialogTitle>
        <DialogDescription>
          Add an existing user to this organization by email.
        </DialogDescription>
      </DialogHeader>
      <form
        id="invite-user-form"
        noValidate
        onSubmit={form.handleSubmit((values) =>
          mutation.mutate(values, { onSuccess: onDone })
        )}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="invite-email">Email</FieldLabel>
            <Input
              id="invite-email"
              type="email"
              aria-invalid={!!form.formState.errors.email}
              {...form.register("email")}
            />
            <FieldError errors={[form.formState.errors.email]} />
          </Field>
        </FieldGroup>
      </form>
      <DialogFooter>
        <Button
          type="submit"
          form="invite-user-form"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? <Spinner data-icon="inline-end" /> : null}
          Invite
        </Button>
      </DialogFooter>
    </>
  )
}
