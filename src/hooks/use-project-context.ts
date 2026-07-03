import { useQuery } from "@tanstack/react-query"
import { useParams } from "react-router"

import { getProject } from "@/api/projects"

export function useProjectContext() {
  const { projectId } = useParams<{ projectId: string }>()

  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId!),
    enabled: !!projectId,
    staleTime: 60_000,
  })

  return {
    projectId,
    project: projectQuery.data,
    isLoading: projectQuery.isLoading,
    isError: projectQuery.isError,
    error: projectQuery.error,
    refetch: projectQuery.refetch,
  }
}
