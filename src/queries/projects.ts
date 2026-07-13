import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import {
  addUserToProject,
  createProject,
  deleteProject,
  getMentionableProjectUsers,
  getProject,
  getProjectUsers,
  listProjects,
  removeUserFromProject,
  resolveProjectUsers,
  updateProject,
} from "@/api/projects"
import { createErrorToastHandler } from "@/lib/query-helpers"
import type { Project } from "@/types/projects"

export function projectQueryKey(projectId: string) {
  return ["project", projectId]
}

export function useProjectQuery(projectId: string | undefined) {
  return useQuery({
    queryKey: projectQueryKey(projectId ?? ""),
    queryFn: () => getProject(projectId ?? ""),
    enabled: !!projectId,
    staleTime: 60_000,
  })
}

export function projectsQueryKey(organizationId: string) {
  return ["projects", organizationId]
}

export function useProjectsQuery(organizationId: string | undefined) {
  return useQuery({
    queryKey: projectsQueryKey(organizationId ?? ""),
    queryFn: () => listProjects(organizationId ?? ""),
    enabled: !!organizationId,
    staleTime: 60_000,
    placeholderData: [],
  })
}

export function projectUsersQueryKey(
  organizationId: string,
  projectId: string
) {
  return ["project-users", organizationId, projectId]
}

export function useProjectUsersQuery(
  organizationId: string | undefined,
  projectId: string | undefined,
  searchTerm?: string,
  page: number = 1,
  pageSize: number = 10,
  options?: { enabled?: boolean; staleTime?: number }
) {
  return useQuery({
    queryKey: [
      ...projectUsersQueryKey(organizationId ?? "", projectId ?? ""),
      searchTerm,
      page,
      pageSize,
    ],
    queryFn: () =>
      getProjectUsers(
        organizationId ?? "",
        projectId ?? "",
        searchTerm,
        page,
        pageSize
      ),
    enabled: options?.enabled ?? (!!organizationId && !!projectId),
    staleTime: options?.staleTime ?? 60_000,
    placeholderData: (previous) => previous,
  })
}

export function fetchProjectUsers(
  queryClient: QueryClient,
  organizationId: string,
  projectId: string,
  searchTerm?: string,
  page: number = 1,
  pageSize: number = 10
) {
  return queryClient.fetchQuery({
    queryKey: [
      ...projectUsersQueryKey(organizationId, projectId),
      searchTerm,
      page,
      pageSize,
    ],
    queryFn: () =>
      getProjectUsers(organizationId, projectId, searchTerm, page, pageSize),
  })
}

export function mentionableProjectUsersQueryKey(
  organizationId: string,
  projectId: string
) {
  return ["mentionable-project-users", organizationId, projectId]
}

export function fetchMentionableProjectUsers(
  queryClient: QueryClient,
  organizationId: string,
  projectId: string,
  searchTerm?: string,
  page: number = 1,
  pageSize: number = 10
) {
  return queryClient.fetchQuery({
    queryKey: [
      ...mentionableProjectUsersQueryKey(organizationId, projectId),
      searchTerm,
      page,
      pageSize,
    ],
    queryFn: () =>
      getMentionableProjectUsers(
        organizationId,
        projectId,
        searchTerm,
        page,
        pageSize
      ),
  })
}

export function useMentionableProjectUsersQuery(
  organizationId: string | undefined,
  projectId: string | undefined,
  searchTerm?: string,
  page: number = 1,
  pageSize: number = 10,
  options?: { enabled?: boolean; staleTime?: number }
) {
  return useQuery({
    queryKey: [
      ...mentionableProjectUsersQueryKey(organizationId ?? "", projectId ?? ""),
      searchTerm,
      page,
      pageSize,
    ],
    queryFn: () =>
      getMentionableProjectUsers(
        organizationId ?? "",
        projectId ?? "",
        searchTerm,
        page,
        pageSize
      ),
    enabled: options?.enabled ?? (!!organizationId && !!projectId),
    staleTime: options?.staleTime ?? 60_000,
    placeholderData: (previous) => previous,
  })
}

export function resolveProjectUsersQueryKey(
  organizationId: string,
  projectId: string,
  userIds: string[]
) {
  return ["resolved-project-users", organizationId, projectId, ...userIds]
}

export function useResolveProjectUsersQuery(
  organizationId: string | undefined,
  projectId: string | undefined,
  userIds: string[],
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: resolveProjectUsersQueryKey(
      organizationId ?? "",
      projectId ?? "",
      userIds
    ),
    queryFn: () =>
      resolveProjectUsers(organizationId ?? "", projectId ?? "", userIds),
    enabled:
      options?.enabled ??
      (!!organizationId && !!projectId && userIds.length > 0),
    staleTime: 60_000,
  })
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: Partial<Project> & { organizationId: string }) =>
      createProject(request),
    onError: createErrorToastHandler("Failed to create project."),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: projectsQueryKey(variables.organizationId),
      })
      toast.success("Project created.")
    },
  })
}

export function useUpdateProjectMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (
      project: Partial<Project> & { id: string; organizationId: string }
    ) => updateProject(project),
    onError: createErrorToastHandler("Failed to update project."),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: projectQueryKey(variables.id),
      })
      queryClient.invalidateQueries({
        queryKey: projectsQueryKey(variables.organizationId),
      })
      toast.success("Project updated.")
    },
  })
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      organizationId,
      projectId,
    }: {
      organizationId: string
      projectId: string
    }) => deleteProject(organizationId, projectId),
    onError: createErrorToastHandler("Failed to delete project."),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: projectsQueryKey(variables.organizationId),
      })
      toast.success("Project deleted.")
    },
  })
}

export function useAddUserToProjectMutation(
  organizationId: string,
  projectId: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) =>
      addUserToProject(organizationId, projectId, userId),
    onError: createErrorToastHandler("Failed to add user to project."),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: projectUsersQueryKey(organizationId, projectId),
      })
      toast.success("User added to project.")
    },
  })
}

export function useRemoveUserFromProjectMutation(
  organizationId: string,
  projectId: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) =>
      removeUserFromProject(organizationId, projectId, userId),
    onError: createErrorToastHandler("Failed to remove member."),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: projectUsersQueryKey(organizationId, projectId),
      })
      toast.success("Member removed.")
    },
  })
}
