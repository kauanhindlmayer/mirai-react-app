import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router"
import { toast } from "sonner"

import {
  forgotPassword,
  getCurrentUser,
  loginUser,
  loginWithGitHub,
  resetPassword,
} from "@/api/users"
import {
  clearAuthStorage,
  getStoredUser,
  isAuthenticated,
  setAccessToken,
  setStoredUser,
} from "@/lib/auth-storage"
import { createErrorToastHandler } from "@/lib/query-helpers"
import type { LoginRequest, ResetPasswordRequest, User } from "@/types/users"

export const CURRENT_USER_QUERY_KEY = ["current-user"]

export function useCurrentUserQuery() {
  return useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: getCurrentUser,
    enabled: isAuthenticated(),
    initialData: getStoredUser() ?? undefined,
    staleTime: 60_000,
  })
}

export function useLoginMutation() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (credentials: LoginRequest): Promise<User> => {
      const { accessToken } = await loginUser(credentials)
      setAccessToken(accessToken)
      const user = await getCurrentUser()
      setStoredUser(user)
      return user
    },
    onSuccess: (user) => {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user)
      navigate("/")
    },
  })
}

export function useGitHubLoginMutation() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: {
      code: string
      redirectUri: string
    }): Promise<User> => {
      const { accessToken } = await loginWithGitHub(
        request.code,
        request.redirectUri
      )
      setAccessToken(accessToken)
      const user = await getCurrentUser()
      setStoredUser(user)
      return user
    },
    onSuccess: (user) => {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user)
      navigate("/")
    },
  })
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: forgotPassword,
    onError: createErrorToastHandler("Forgot password request failed."),
  })
}

export function useResetPasswordMutation() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (request: ResetPasswordRequest) => resetPassword(request),
    onError: createErrorToastHandler("Password reset failed."),
    onSuccess: () => {
      toast.success("Password reset successfully. Please log in.")
      navigate("/login")
    },
  })
}

export function useLogout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return function logout() {
    clearAuthStorage()
    queryClient.clear()
    navigate("/login")
  }
}
