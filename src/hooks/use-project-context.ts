import { useQuery } from "@tanstack/react-query"
import { useParams } from "react-router"

import { getProject } from "@/api/projects"

export function useProjectContext() {
  const { projectId } = useParams<{ projectId: string }>()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId!),
    enabled: !!projectId,
    staleTime: 60_000,
  })

  return {
    projectId,
    project: data,
    isLoading,
    isError,
    error,
    refetch,
  }
}
