import { useState } from "react"
import { toast } from "sonner"

import {
  useNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
} from "@/queries/notifications"
import type { NotificationPreferences } from "@/types/notifications"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"

const CATEGORY_LABELS: Record<keyof NotificationPreferences, string> = {
  mentionsEnabled: "Mentions in comments",
  assignedWorkItemChangesEnabled: "Changes to work items assigned to me",
  workItemCommentsEnabled: "Comments on work items assigned to me",
  membershipEnabled: "Added to a project, team, or organization",
}

export function NotificationPreferencesSection() {
  const { data: preferences } = useNotificationPreferencesQuery()

  if (!preferences) {
    return null
  }

  return <NotificationPreferencesForm preferences={preferences} />
}

type NotificationPreferencesFormProps = {
  preferences: NotificationPreferences
}

function NotificationPreferencesForm({
  preferences,
}: NotificationPreferencesFormProps) {
  const [draft, setDraft] = useState(preferences)
  const updateMutation = useUpdateNotificationPreferencesMutation()

  const hasUnsavedChanges = (
    Object.keys(draft) as (keyof NotificationPreferences)[]
  ).some((key) => draft[key] !== preferences[key])

  function toggleCategory(category: keyof NotificationPreferences) {
    setDraft((current) => ({ ...current, [category]: !current[category] }))
  }

  async function handleSave() {
    try {
      await updateMutation.mutateAsync(draft)
    } catch {
      return
    }
    toast.success("Notification preferences updated.")
  }

  return (
    <FieldGroup>
      <FieldDescription>
        Choose which notifications you want to receive.
      </FieldDescription>
      {(Object.keys(CATEGORY_LABELS) as (keyof NotificationPreferences)[]).map(
        (category) => (
          <Field key={category} orientation="horizontal">
            <Checkbox
              id={`notification-preference-${category}`}
              checked={draft[category]}
              onCheckedChange={() => toggleCategory(category)}
            />
            <FieldLabel
              htmlFor={`notification-preference-${category}`}
              className="font-normal"
            >
              {CATEGORY_LABELS[category]}
            </FieldLabel>
          </Field>
        )
      )}
      <Field>
        <Button
          onClick={handleSave}
          disabled={!hasUnsavedChanges || updateMutation.isPending}
        >
          {updateMutation.isPending ? <Spinner data-icon="inline-end" /> : null}
          Save changes
        </Button>
      </Field>
    </FieldGroup>
  )
}
