import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import {
  useCreateRetrospectiveMutation,
  useUpdateRetrospectiveMutation,
} from "@/queries/retrospectives"
import { ProcessTemplate, type Retrospective } from "@/types/retrospectives"

const PROCESS_TEMPLATE_LABELS: Record<ProcessTemplate, string> = {
  Classic: "Classic",
  StartStopContinue: "Start / Stop / Continue",
  MadSadGlad: "Mad / Sad / Glad",
  LikedLearnedLackedLongedFor: "Liked / Learned / Lacked / Longed For",
  Sailboat: "Sailboat",
}

const PROCESS_TEMPLATE_VALUES = Object.values(ProcessTemplate) as [
  ProcessTemplate,
  ...ProcessTemplate[],
]

const retrospectiveSchema = z.object({
  title: z.string().min(1, "Title is required."),
  maxVotesPerUser: z.number().min(3).max(12),
  template: z.enum(PROCESS_TEMPLATE_VALUES),
})

type RetrospectiveFormValues = z.infer<typeof retrospectiveSchema>

type RetrospectiveDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamId: string
  retrospective?: Retrospective
  onCreated?: (retrospectiveId: string) => void
}

export function RetrospectiveDialog({
  open,
  onOpenChange,
  teamId,
  retrospective,
  onCreated,
}: RetrospectiveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open ? (
          <RetrospectiveForm
            teamId={teamId}
            retrospective={retrospective}
            onDone={() => onOpenChange(false)}
            onCreated={onCreated}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function RetrospectiveForm({
  teamId,
  retrospective,
  onDone,
  onCreated,
}: {
  teamId: string
  retrospective?: Retrospective
  onDone: () => void
  onCreated?: (retrospectiveId: string) => void
}) {
  const isUpdateMode = !!retrospective

  const form = useForm<RetrospectiveFormValues>({
    defaultValues: {
      title: retrospective?.title ?? "",
      maxVotesPerUser: retrospective?.maxVotesPerUser ?? 5,
      template: retrospective?.template ?? ProcessTemplate.Classic,
    },
    resolver: zodResolver(retrospectiveSchema),
  })

  const createMutation = useCreateRetrospectiveMutation()
  const updateMutation = useUpdateRetrospectiveMutation(retrospective?.id ?? "")

  function submit(values: RetrospectiveFormValues) {
    if (isUpdateMode) {
      updateMutation.mutate(values, { onSuccess: onDone })
    } else {
      createMutation.mutate(
        { ...values, teamId },
        {
          onSuccess: (retrospectiveId) => {
            onCreated?.(retrospectiveId)
            onDone()
          },
        }
      )
    }
  }

  const mutation = isUpdateMode ? updateMutation : createMutation

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {isUpdateMode ? "Update" : "Create"} Retrospective
        </DialogTitle>
        <DialogDescription>
          {isUpdateMode
            ? "Update this retrospective's settings."
            : "Set up a new board to start collecting feedback and insights."}
        </DialogDescription>
      </DialogHeader>
      <form id="retrospective-form" onSubmit={form.handleSubmit(submit)}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="retrospective-title">Title</FieldLabel>
            <Input
              id="retrospective-title"
              placeholder={`Example: Retrospective ${new Date().toLocaleDateString()}`}
              aria-invalid={!!form.formState.errors.title}
              {...form.register("title")}
            />
            <FieldError errors={[form.formState.errors.title]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="retrospective-max-votes">
              Max Votes Per User
            </FieldLabel>
            <Input
              id="retrospective-max-votes"
              type="number"
              min={3}
              max={12}
              aria-invalid={!!form.formState.errors.maxVotesPerUser}
              {...form.register("maxVotesPerUser", { valueAsNumber: true })}
            />
            <FieldError errors={[form.formState.errors.maxVotesPerUser]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="retrospective-template">Template</FieldLabel>
            <Select
              value={form.watch("template")}
              onValueChange={(value) =>
                form.setValue("template", value as ProcessTemplate)
              }
            >
              <SelectTrigger id="retrospective-template" className="w-full">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {PROCESS_TEMPLATE_VALUES.map((template) => (
                  <SelectItem key={template} value={template}>
                    {PROCESS_TEMPLATE_LABELS[template]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isUpdateMode ? (
              <p className="text-xs text-muted-foreground">
                Existing feedback items will not be preserved when changing the
                board template.
              </p>
            ) : null}
          </Field>
        </FieldGroup>
      </form>
      <DialogFooter>
        <Button
          type="submit"
          form="retrospective-form"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? <Spinner data-icon="inline-end" /> : null}
          {isUpdateMode ? "Update" : "Create"}
        </Button>
      </DialogFooter>
    </>
  )
}
