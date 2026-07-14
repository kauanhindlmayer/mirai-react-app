import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react"

import { MentionHoverCardContent } from "@/components/common/mention/mention-hover-card-content"
import type { MentionSuggestionItem } from "@/components/common/mention/mention-suggestion-item"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

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
    >
      <HoverCard openDelay={200} closeDelay={100}>
        <HoverCardTrigger asChild>
          <span className="mention rounded-sm bg-accent px-1 align-middle text-sm font-medium">
            @{fullName}
          </span>
        </HoverCardTrigger>
        <HoverCardContent align="start" className="w-64">
          <MentionHoverCardContent userId={userId} fallbackName={fullName} />
        </HoverCardContent>
      </HoverCard>
    </NodeViewWrapper>
  )
}
