import {
  useNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
} from "@/queries/notifications"
import type { NotificationPreferences } from "@/types/notifications"
import { ErrorState } from "@/components/common/error-state"
import { Field, FieldContent, FieldLabel } from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"

type PreferenceCopy = {
  label: string
  description: string
}

const PREFERENCE_COPY: Record<keyof NotificationPreferences, PreferenceCopy> = {
  mentionsEnabled: {
    label: "Mentions",
    description: "When someone @mentions you in a work item or wiki comment.",
  },
  assignedWorkItemChangesEnabled: {
    label: "Assigned work items",
    description: "When a work item assigned to you is changed.",
  },
  workItemCommentsEnabled: {
    label: "Comments on your work items",
    description: "When someone comments on a work item assigned to you.",
  },
  membershipEnabled: {
    label: "Memberships",
    description: "When you are added to a project, team, or organization.",
  },
}

const PREFERENCE_KEYS = Object.keys(
  PREFERENCE_COPY
) as (keyof NotificationPreferences)[]

export function NotificationPreferencesSection() {
  const { data: preferences, isError, error, refetch } =
    useNotificationPreferencesQuery()

  if (isError) {
    return (
      <ErrorState
        title="Couldn't load notification preferences"
        error={error}
        onRetry={() => refetch()}
      />
    )
  }

  if (!preferences) {
    return <NotificationPreferencesSkeleton />
  }

  return <NotificationPreferencesForm preferences={preferences} />
}

function NotificationPreferencesSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {PREFERENCE_KEYS.map((key) => (
        <div key={key} className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-[16.6px] w-7 rounded-full" />
        </div>
      ))}
    </div>
  )
}

type NotificationPreferencesFormProps = {
  preferences: NotificationPreferences
}

function NotificationPreferencesForm({
  preferences,
}: NotificationPreferencesFormProps) {
  const updateMutation = useUpdateNotificationPreferencesMutation()

  function toggleCategory(category: keyof NotificationPreferences) {
    updateMutation.mutate({
      ...preferences,
      [category]: !preferences[category],
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {PREFERENCE_KEYS.map((category) => {
        const { label, description } = PREFERENCE_COPY[category]
        const inputId = `notification-preference-${category}`
        return (
          <Field key={category} orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor={inputId} className="font-medium">
                {label}
              </FieldLabel>
              <p className="text-muted-foreground">{description}</p>
            </FieldContent>
            <Switch
              id={inputId}
              checked={preferences[category]}
              onCheckedChange={() => toggleCategory(category)}
            />
          </Field>
        )
      })}
    </div>
  )
}
