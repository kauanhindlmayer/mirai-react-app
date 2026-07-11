import { useRef, useState } from "react"
import { toast } from "sonner"

import { useCurrentUserQuery } from "@/hooks/use-auth"
import {
  useUpdateAvatarMutation,
  useUpdateUserProfileMutation,
} from "@/queries/users"
import { getAvatarUrl } from "@/lib/get-avatar-url"
import { getInitials } from "@/lib/utils"
import type { User } from "@/types/users"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

type AccountSettingsSectionProps = {
  onSaved?: () => void
}

export function AccountSettingsSection({
  onSaved,
}: AccountSettingsSectionProps) {
  const { data: user } = useCurrentUserQuery()

  if (!user) {
    return null
  }

  return <AccountForm user={user} onSaved={onSaved} />
}

type AccountFormProps = {
  user: User
  onSaved?: () => void
}

function AccountForm({ user, onSaved }: AccountFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [firstName, setFirstName] = useState(user.firstName)
  const [lastName, setLastName] = useState(user.lastName)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const hasUnsavedChanges =
    firstName !== user.firstName ||
    lastName !== user.lastName ||
    avatarFile !== null

  const profileMutation = useUpdateUserProfileMutation()
  const avatarMutation = useUpdateAvatarMutation()

  async function handleSave() {
    try {
      if (firstName !== user.firstName || lastName !== user.lastName) {
        await profileMutation.mutateAsync({ firstName, lastName })
      }
      if (avatarFile) {
        await avatarMutation.mutateAsync(avatarFile)
      }
    } catch {
      return
    }
    toast.success("Profile updated.")
    onSaved?.()
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const isSaving = profileMutation.isPending || avatarMutation.isPending

  return (
    <FieldGroup>
      <FieldDescription>Update your name and profile picture.</FieldDescription>
      <Field>
        <button
          type="button"
          className="w-fit cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Avatar className="size-16">
            <AvatarImage
              src={avatarPreview ?? getAvatarUrl(user.imageUrl)}
              alt={user.fullName}
            />
            <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
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
        <FieldLabel htmlFor="profile-first-name">First Name</FieldLabel>
        <Input
          id="profile-first-name"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="profile-last-name">Last Name</FieldLabel>
        <Input
          id="profile-last-name"
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
        />
      </Field>
      <Field>
        <Button onClick={handleSave} disabled={!hasUnsavedChanges || isSaving}>
          {isSaving ? <Spinner data-icon="inline-end" /> : null}
          Save changes
        </Button>
      </Field>
    </FieldGroup>
  )
}
