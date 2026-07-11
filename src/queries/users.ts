import { useMutation, useQueryClient } from "@tanstack/react-query"

import { registerUser, updateAvatar, updateUserProfile } from "@/api/users"
import { CURRENT_USER_QUERY_KEY } from "@/hooks/use-auth"
import { createErrorToastHandler } from "@/lib/query-helpers"

export function useRegisterMutation() {
  return useMutation({
    mutationFn: registerUser,
    onError: createErrorToastHandler("Sign up failed."),
  })
}

export function useUpdateUserProfileMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateUserProfile,
    onError: createErrorToastHandler("Failed to update profile."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY })
    },
  })
}

export function useUpdateAvatarMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateAvatar,
    onError: createErrorToastHandler("Failed to update avatar."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY })
    },
  })
}
