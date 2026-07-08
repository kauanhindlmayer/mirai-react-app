import { del, get, post } from "@/lib/api-client"
import type {
  ConnectGitHubRepositoryRequest,
  GitHubInstallUrl,
  GitHubPullRequest,
  GitHubRepository,
} from "@/types/github"

export function getGitHubInstallUrl(
  organizationId: string,
  projectId: string
): Promise<GitHubInstallUrl> {
  return get(
    `/organizations/${organizationId}/projects/${projectId}/github/install-url`
  )
}

export function getGitHubInstallationRepositories(
  organizationId: string,
  projectId: string,
  installationId: number,
  state: string
): Promise<GitHubRepository[]> {
  return get(
    `/organizations/${organizationId}/projects/${projectId}/github/installations/${installationId}/repositories`,
    { params: { state } }
  )
}

export function connectGitHubRepository(
  organizationId: string,
  projectId: string,
  request: ConnectGitHubRepositoryRequest
): Promise<void> {
  return post(
    `/organizations/${organizationId}/projects/${projectId}/github/connect`,
    request
  )
}

export function disconnectGitHubRepository(
  organizationId: string,
  projectId: string
): Promise<void> {
  return del(
    `/organizations/${organizationId}/projects/${projectId}/github/connection`
  )
}

export function searchGitHubPullRequests(
  organizationId: string,
  projectId: string,
  searchTerm: string
): Promise<GitHubPullRequest[]> {
  return get(
    `/organizations/${organizationId}/projects/${projectId}/github/pull-requests/search`,
    { params: { q: searchTerm } }
  )
}
