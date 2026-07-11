import { useEffect } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import Placeholder from "@tiptap/extension-placeholder"
import StarterKit from "@tiptap/starter-kit"

import { useProjectMentionExtension } from "@/hooks/use-project-mention-extension"
import { cn } from "@/lib/utils"

type MentionableEditorProps = {
  content: string
  onChange?: (html: string) => void
  onBlur?: () => void
  editable?: boolean
  placeholder?: string
  ariaLabel?: string
}

export function MentionableEditor({
  content,
  onChange,
  onBlur,
  editable = true,
  placeholder,
  ariaLabel,
}: MentionableEditorProps) {
  const mentionExtension = useProjectMentionExtension()

  const editor = useEditor({
    extensions: [
      StarterKit,
      mentionExtension,
      ...(placeholder ? [Placeholder.configure({ placeholder })] : []),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
    onBlur: () => onBlur?.(),
    editorProps: {
      attributes: {
        class: cn("tiptap-content text-sm focus:outline-none"),
        ...(editable
          ? {
              role: "textbox",
              "aria-multiline": "true",
              ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
            }
          : {}),
      },
    },
  })

  useEffect(() => {
    if (!editor || editable) return
    // Read-only instances have no onChange feedback loop, so `content` only
    // ever changes for a genuinely external reason (e.g. a SignalR-driven
    // refetch) - useEditor otherwise only reads `content` at mount, so
    // without this a read-only view would go stale. Editable instances
    // deliberately skip this: while typing, `content` briefly lags the
    // live document (async re-render), and re-syncing from that stale
    // snapshot would overwrite what the user just typed.
    if (content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor, editable])

  if (!editor) return null

  return <EditorContent editor={editor} />
}
