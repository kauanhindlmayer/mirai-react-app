import { useParams } from "react-router"

import { useProjectQuery } from "@/queries/projects"

export function useCurrentProject() {
  const { projectId } = useParams<{ projectId: string }>()

  const { data, isLoading, isError, error, refetch } = useProjectQuery(projectId)

  return {
    projectId,
    project: data,
    isLoading,
    isError,
    error,
    refetch,
  }
}
