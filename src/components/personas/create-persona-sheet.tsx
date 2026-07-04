import { useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { PlusIcon, UserIcon } from "lucide-react"
import { z } from "zod"

import { useCreatePersonaMutation } from "@/queries/personas"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"

const personaSchema = z.object({
  name: z.string().min(1, "Name is required."),
  description: z.string(),
})

type PersonaFormValues = z.infer<typeof personaSchema>

export function CreatePersonaSheet({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <PlusIcon />
          New Persona
        </Button>
      </SheetTrigger>
      <SheetContent>
        {open ? (
          <CreatePersonaForm
            projectId={projectId}
            onDone={() => setOpen(false)}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function CreatePersonaForm({
  projectId,
  onDone,
}: {
  projectId: string
  onDone: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const form = useForm<PersonaFormValues>({
    defaultValues: { name: "", description: "" },
    resolver: zodResolver(personaSchema),
  })

  const mutation = useCreatePersonaMutation(projectId)

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>Create persona</SheetTitle>
        <SheetDescription>
          Personas capture your users' goals and behaviors.
        </SheetDescription>
      </SheetHeader>
      <form
        id="create-persona-form"
        className="px-4"
        onSubmit={form.handleSubmit((values) =>
          mutation.mutate(
            { ...values, file: imageFile ?? undefined },
            { onSuccess: onDone }
          )
        )}
      >
        <FieldGroup>
          <Field>
            <button
              type="button"
              className="w-fit cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Avatar className="size-16 rounded-lg">
                <AvatarImage src={imagePreview ?? undefined} alt="" />
                <AvatarFallback className="rounded-lg">
                  <UserIcon className="size-6 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="persona-name">Name</FieldLabel>
            <Input
              id="persona-name"
              aria-invalid={!!form.formState.errors.name}
              {...form.register("name")}
            />
            <FieldError errors={[form.formState.errors.name]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="persona-description">Description</FieldLabel>
            <Textarea
              id="persona-description"
              {...form.register("description")}
            />
          </Field>
        </FieldGroup>
      </form>
      <SheetFooter>
        <Button
          type="submit"
          form="create-persona-form"
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
