import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router"

import { getCurrentUser, loginUser, loginWithGitHub } from "@/api/users"
import {
  clearAuthStorage,
  getStoredUser,
  isAuthenticated,
  setAccessToken,
  setStoredUser,
} from "@/lib/auth-storage"
import type { LoginRequest, User } from "@/types/users"

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

export function useLogout() {
  const navigate = useNavigate()

  return function logout() {
    clearAuthStorage()
    navigate("/login")
  }
}
