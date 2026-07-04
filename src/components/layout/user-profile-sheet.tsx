import { useRef, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { updateAvatar, updateUserProfile } from "@/api/users"
import { CURRENT_USER_QUERY_KEY, useCurrentUserQuery } from "@/hooks/use-auth"
import { getInitials } from "@/lib/utils"
import type { User } from "@/types/users"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

type UserProfileSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserProfileSheet({
  open,
  onOpenChange,
}: UserProfileSheetProps) {
  const { data: user } = useCurrentUserQuery()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        {open && user ? (
          <ProfileForm user={user} onOpenChange={onOpenChange} />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function ProfileForm({
  user,
  onOpenChange,
}: {
  user: User
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [firstName, setFirstName] = useState(user.firstName)
  const [lastName, setLastName] = useState(user.lastName)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const hasUnsavedChanges =
    firstName !== user.firstName ||
    lastName !== user.lastName ||
    avatarFile !== null

  const profileMutation = useMutation({
    mutationFn: updateUserProfile,
    onError: (error) => {
      toast.error("Failed to update profile.", {
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      })
    },
  })

  const avatarMutation = useMutation({
    mutationFn: updateAvatar,
    onError: (error) => {
      toast.error("Failed to update avatar.", {
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      })
    },
  })

  async function handleSave() {
    if (firstName !== user.firstName || lastName !== user.lastName) {
      await profileMutation.mutateAsync({ firstName, lastName })
    }
    if (avatarFile) {
      await avatarMutation.mutateAsync(avatarFile)
    }
    await queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY })
    toast.success("Profile updated.")
    onOpenChange(false)
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const isSaving = profileMutation.isPending || avatarMutation.isPending

  return (
    <>
      <SheetHeader>
        <SheetTitle>Edit profile</SheetTitle>
        <SheetDescription>
          Update your name and profile picture.
        </SheetDescription>
      </SheetHeader>
      <FieldGroup className="px-4">
        <Field>
          <button
            type="button"
            className="w-fit cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Avatar className="size-16">
              <AvatarImage
                src={avatarPreview ?? user.imageUrl}
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
      </FieldGroup>
      <SheetFooter>
        <Button onClick={handleSave} disabled={!hasUnsavedChanges || isSaving}>
          {isSaving ? <Spinner data-icon="inline-end" /> : null}
          Save changes
        </Button>
        <SheetClose asChild>
          <Button variant="outline">Cancel</Button>
        </SheetClose>
      </SheetFooter>
    </>
  )
}
