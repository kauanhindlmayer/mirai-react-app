import { shift } from "@floating-ui/dom"
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
  debounceMs?: number
}

export function createMentionExtension({
  fetchSuggestions,
  useResolveMention,
  debounceMs,
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
      floatingUi: { middleware: [shift({ padding: 8 })] },
      ...(debounceMs ? { debounce: debounceMs } : {}),
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
      // This element is appended straight to document.body, bypassing Radix's
      // portal/isolation machinery - matching the app's z-50 overlay
      // convention isn't enough, since Radix Dialog's overlay establishes its
      // own isolated stacking context and wins z-50-vs-z-50 ties. A mention
      // popup must outrank whatever surface it was triggered from, so this
      // uses a value clearly above every existing z-50 overlay instead.
      component.element.style.zIndex = "9999"
      // While a Dialog is open, Radix's scroll lock sets body { pointer-events:
      // none } so only the dialog itself stays interactive - which this
      // element, as a direct child of body, would otherwise silently inherit.
      component.element.style.pointerEvents = "auto"
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
