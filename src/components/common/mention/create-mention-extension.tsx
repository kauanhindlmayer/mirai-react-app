import Mention from "@tiptap/extension-mention"
import {
  ReactNodeViewRenderer,
  ReactRenderer,
  type NodeViewProps,
} from "@tiptap/react"
import type { SuggestionOptions } from "@tiptap/suggestion"

import { MentionChip } from "@/components/common/mention/mention-chip"
import type { MentionSuggestionItem } from "@/components/common/mention/mention-suggestion-item"
import {
  MentionSuggestionList,
  type MentionSuggestionListHandle,
} from "@/components/common/mention/mention-suggestion-list"

export type { MentionSuggestionItem }

type CreateMentionExtensionOptions = {
  fetchSuggestions: (
    query: string
  ) => MentionSuggestionItem[] | Promise<MentionSuggestionItem[]>
  useResolveMention: (userId: string) => MentionSuggestionItem | undefined
}

export function createMentionExtension({
  fetchSuggestions,
  useResolveMention,
}: CreateMentionExtensionOptions) {
  return Mention.extend({
    addNodeView() {
      return createMentionChipNodeView(useResolveMention)
    },
  }).configure({
    HTMLAttributes: { class: "mention" },
    suggestion: {
      char: "@",
      items: ({ query }) => fetchSuggestions(query),
      render: createSuggestionRenderer,
    } satisfies Partial<SuggestionOptions<MentionSuggestionItem>>,
  })
}

function createMentionChipNodeView(
  useResolveMention: (userId: string) => MentionSuggestionItem | undefined
) {
  function MentionChipNodeView(props: NodeViewProps) {
    return <MentionChip {...props} useResolveMention={useResolveMention} />
  }

  return ReactNodeViewRenderer(MentionChipNodeView)
}

const createSuggestionRenderer: NonNullable<
  SuggestionOptions<MentionSuggestionItem>["render"]
> = () => {
  let component: ReactRenderer<MentionSuggestionListHandle> | undefined
  let unmount: (() => void) | undefined

  return {
    onStart(props) {
      component = new ReactRenderer(MentionSuggestionList, {
        props,
        editor: props.editor,
      })
      unmount = props.mount(component.element)
    },
    onUpdate(props) {
      component?.updateProps(props)
    },
    onKeyDown(props) {
      if (props.event.key === "Escape") {
        unmount?.()
        component?.destroy()
        return true
      }
      return component?.ref?.onKeyDown(props) ?? false
    },
    onExit() {
      unmount?.()
      component?.destroy()
    },
  }
}
