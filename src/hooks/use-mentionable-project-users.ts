import { useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { fetchProjectUsers, useProjectUsersQuery } from "@/queries/projects"
import type { ProjectUserResponse } from "@/types/work-items"
import type { MentionSuggestionItem } from "@/components/common/mention/mention-suggestion-item"

const SUGGESTION_PAGE_SIZE = 10
const RESOLUTION_PAGE_SIZE = 100

function toMentionSuggestionItem(
  user: ProjectUserResponse
): MentionSuggestionItem {
  return { id: user.id, fullName: user.fullName, imageUrl: user.imageUrl }
}

export function useMentionableProjectUsers(
  organizationId: string | undefined,
  projectId: string | undefined
) {
  const queryClient = useQueryClient()

  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (!organizationId || !projectId) return []

      const result = await fetchProjectUsers(
        queryClient,
        organizationId,
        projectId,
        query,
        1,
        SUGGESTION_PAGE_SIZE
      )
      return result.items.map(toMentionSuggestionItem)
    },
    [queryClient, organizationId, projectId]
  )

  function useResolveMention(
    userId: string
  ): MentionSuggestionItem | undefined {
    const { data } = useProjectUsersQuery(
      organizationId,
      projectId,
      undefined,
      1,
      RESOLUTION_PAGE_SIZE,
      { staleTime: 60_000 }
    )
    const user = data?.items.find((item) => item.id === userId)
    return user ? toMentionSuggestionItem(user) : undefined
  }

  return { fetchSuggestions, useResolveMention }
}
