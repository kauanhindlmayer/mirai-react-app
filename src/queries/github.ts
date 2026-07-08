import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  connectGitHubRepository,
  disconnectGitHubRepository,
  getGitHubInstallationRepositories,
  getGitHubInstallUrl,
  searchGitHubPullRequests,
} from "@/api/github"
import { projectQueryKey } from "@/queries/projects"
import { createErrorToastHandler } from "@/lib/query-helpers"
import type { ConnectGitHubRepositoryRequest } from "@/types/github"

export function gitHubInstallationRepositoriesQueryKey(
  organizationId: string,
  projectId: string,
  installationId: number,
  state: string
) {
  return [
    "github-installation-repositories",
    organizationId,
    projectId,
    installationId,
    state,
  ]
}

export function useGetGitHubInstallUrlMutation(
  organizationId: string,
  projectId: string
) {
  return useMutation({
    mutationFn: () => getGitHubInstallUrl(organizationId, projectId),
    onError: createErrorToastHandler(
      "Failed to start the GitHub connection."
    ),
  })
}

export function useGitHubInstallationRepositoriesQuery(
  organizationId: string,
  projectId: string,
  installationId: number,
  state: string,
  options: { enabled: boolean }
) {
  return useQuery({
    queryKey: gitHubInstallationRepositoriesQueryKey(
      organizationId,
      projectId,
      installationId,
      state
    ),
    queryFn: () =>
      getGitHubInstallationRepositories(
        organizationId,
        projectId,
        installationId,
        state
      ),
    enabled: options.enabled,
  })
}

export function useConnectGitHubRepositoryMutation(
  organizationId: string,
  projectId: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: ConnectGitHubRepositoryRequest) =>
      connectGitHubRepository(organizationId, projectId, request),
    onError: createErrorToastHandler("Failed to connect the repository."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectQueryKey(projectId) })
    },
  })
}

export function useDisconnectGitHubRepositoryMutation(
  organizationId: string,
  projectId: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => disconnectGitHubRepository(organizationId, projectId),
    onError: createErrorToastHandler("Failed to disconnect the repository."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectQueryKey(projectId) })
    },
  })
}

export function useGitHubPullRequestsSearchQuery(
  organizationId: string,
  projectId: string,
  searchTerm: string,
  options: { enabled: boolean }
) {
  return useQuery({
    queryKey: [
      "github-pull-requests-search",
      organizationId,
      projectId,
      searchTerm,
    ],
    queryFn: () =>
      searchGitHubPullRequests(organizationId, projectId, searchTerm),
    enabled: options.enabled,
    staleTime: 30_000,
  })
}
