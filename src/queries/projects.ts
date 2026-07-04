import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  addUserToProject,
  createProject,
  deleteProject,
  getProject,
  getProjectUsers,
  listProjects,
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

export function projectUsersQueryKey(organizationId: string, projectId: string) {
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
      getProjectUsers(organizationId ?? "", projectId ?? "", searchTerm, page, pageSize),
    enabled: options?.enabled ?? (!!organizationId && !!projectId),
    staleTime: options?.staleTime ?? 60_000,
    placeholderData: (previous) => previous,
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
