import { createMentionExtension } from "@/components/common/mention/create-mention-extension"
import { useCurrentProject } from "@/hooks/use-current-project"
import { useMentionableProjectUsers } from "@/hooks/use-mentionable-project-users"

const MENTION_SUGGESTION_DEBOUNCE_MS = 300

export function useProjectMentionExtension() {
  const { projectId, project } = useCurrentProject()
  const { fetchSuggestions, useResolveMention } = useMentionableProjectUsers(
    project?.organizationId,
    projectId
  )

  return createMentionExtension({
    fetchSuggestions,
    useResolveMention,
    debounceMs: MENTION_SUGGESTION_DEBOUNCE_MS,
  })
}
