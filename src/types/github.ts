export type GitHubRepositoryConnection = {
  repositoryId: number
  repositoryOwner: string
  repositoryName: string
  connectedAtUtc: string
}

export type GitHubRepository = {
  id: number
  owner: string
  name: string
}

export type GitHubInstallUrl = {
  url: string
}

export type ConnectGitHubRepositoryRequest = {
  installationId: number
  repositoryId: number
  repositoryOwner: string
  repositoryName: string
}

export type GitHubPullRequest = {
  id: number
  number: number
  title: string
  htmlUrl: string
  isOpen: boolean
  isMerged: boolean
  authorLogin?: string
}
