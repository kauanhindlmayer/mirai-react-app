import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react"

import { getAvatarUrl } from "@/lib/get-avatar-url"
import { getInitials } from "@/lib/utils"
import type { MentionSuggestionItem } from "@/components/common/mention/mention-suggestion-item"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type MentionChipProps = NodeViewProps & {
  useResolveMention: (userId: string) => MentionSuggestionItem | undefined
}

export function MentionChip({ node, useResolveMention }: MentionChipProps) {
  const userId = node.attrs.id as string
  const fallbackLabel = node.attrs.label as string
  const resolved = useResolveMention(userId)
  const fullName = resolved?.fullName ?? fallbackLabel

  return (
    <NodeViewWrapper
      as="span"
      contentEditable={false}
      data-mention-user-id={userId}
      className="mention inline-flex items-center gap-1 rounded-sm bg-accent px-1 align-middle text-sm font-medium"
    >
      <Avatar className="size-4">
        <AvatarImage src={getAvatarUrl(resolved?.imageUrl)} alt={fullName} />
        <AvatarFallback className="text-[0.5rem]">
          {getInitials(fullName)}
        </AvatarFallback>
      </Avatar>
      @{fullName}
    </NodeViewWrapper>
  )
}
