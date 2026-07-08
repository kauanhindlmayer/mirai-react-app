import type { GitHubRepositoryConnection } from "@/types/github"

export type Project = {
  id: string
  name: string
  description: string
  organizationId: string
  createdAtUtc: string
  updatedAtUtc?: string
  gitHubRepositoryConnection?: GitHubRepositoryConnection
}
