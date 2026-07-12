import { useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"

import {
  fetchProjectUsers,
  useProjectUsersQuery,
  useResolveProjectUsersQuery,
} from "@/queries/projects"
import type {
  ProjectUserResponse,
  ResolvedUserResponse,
} from "@/types/work-items"
import type { MentionSuggestionItem } from "@/components/common/mention/mention-suggestion-item"

const SUGGESTION_PAGE_SIZE = 10
const RESOLUTION_PAGE_SIZE = 100
const UNKNOWN_MENTIONED_USER_NAME = "Unknown user"

function toMentionSuggestionItem(
  user: Pick<
    ProjectUserResponse | ResolvedUserResponse,
    "id" | "fullName" | "imageUrl"
  >
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
    const { data, isFetched: isProjectMembersFetched } = useProjectUsersQuery(
      organizationId,
      projectId,
      undefined,
      1,
      RESOLUTION_PAGE_SIZE,
      { staleTime: 60_000 }
    )
    const projectMember = data?.items.find((item) => item.id === userId)

    // Most mentions resolve here (a current project member), so the
    // fallback lookup below only runs once we've confirmed this one didn't.
    const shouldResolveFallback = isProjectMembersFetched && !projectMember

    const { data: resolvedUsers, isFetched: isFallbackFetched } =
      useResolveProjectUsersQuery(organizationId, projectId, [userId], {
        enabled: shouldResolveFallback,
      })

    if (projectMember) {
      return toMentionSuggestionItem(projectMember)
    }

    const fallbackUser = resolvedUsers?.find((user) => user.id === userId)
    if (fallbackUser) {
      return toMentionSuggestionItem(fallbackUser)
    }

    if (shouldResolveFallback && isFallbackFetched) {
      return { id: userId, fullName: UNKNOWN_MENTIONED_USER_NAME }
    }

    return undefined
  }

  return { fetchSuggestions, useResolveMention }
}
