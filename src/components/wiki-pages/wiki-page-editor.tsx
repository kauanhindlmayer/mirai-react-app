import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import {
  BoldIcon,
  Heading1Icon,
  Heading2Icon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
} from "lucide-react"

import { useProjectMentionExtension } from "@/hooks/use-project-mention-extension"
import { Toggle } from "@/components/ui/toggle"
import { cn } from "@/lib/utils"

type WikiPageEditorProps = {
  content: string
  onChange?: (html: string) => void
  editable?: boolean
}

export function WikiPageEditor({
  content,
  onChange,
  editable = true,
}: WikiPageEditorProps) {
  const mentionExtension = useProjectMentionExtension()

  const editor = useEditor({
    extensions: [StarterKit, mentionExtension],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          "tiptap-content focus:outline-none",
          editable && "min-h-48 rounded-md border px-3 py-2"
        ),
        ...(editable
          ? {
              role: "textbox",
              "aria-multiline": "true",
              "aria-label": "Wiki page content",
            }
          : {}),
      },
    },
  })

  if (!editor) return null

  return (
    <div className="flex flex-col gap-2">
      {editable ? <WikiPageEditorToolbar editor={editor} /> : null}
      <EditorContent editor={editor} />
    </div>
  )
}

function WikiPageEditorToolbar({
  editor,
}: {
  editor: NonNullable<ReturnType<typeof useEditor>>
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-md border p-1">
      <Toggle
        size="sm"
        pressed={editor.isActive("bold")}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        aria-label="Bold"
      >
        <BoldIcon className="size-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("italic")}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        aria-label="Italic"
      >
        <ItalicIcon className="size-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 1 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
        aria-label="Heading 1"
      >
        <Heading1Icon className="size-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 2 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
        aria-label="Heading 2"
      >
        <Heading2Icon className="size-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("bulletList")}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        aria-label="Bullet list"
      >
        <ListIcon className="size-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("orderedList")}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        aria-label="Numbered list"
      >
        <ListOrderedIcon className="size-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("blockquote")}
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
        aria-label="Quote"
      >
        <QuoteIcon className="size-3.5" />
      </Toggle>
    </div>
  )
}
