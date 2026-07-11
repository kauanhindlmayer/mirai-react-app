import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react"

import type { MentionSuggestionItem } from "@/components/common/mention/mention-suggestion-item"

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
      className="mention rounded-sm bg-accent px-1 align-middle text-sm font-medium"
    >
      @{fullName}
    </NodeViewWrapper>
  )
}
