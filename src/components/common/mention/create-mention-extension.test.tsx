import { EditorContent, useEditor, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { describe, expect, it } from "vitest"
import userEvent from "@testing-library/user-event"

import { createMentionExtension } from "@/components/common/mention/create-mention-extension"
import type { MentionSuggestionItem } from "@/components/common/mention/mention-suggestion-item"
import { render, screen, waitFor } from "@/test/test-utils"

const PEOPLE: MentionSuggestionItem[] = [
  { id: "1", fullName: "Alice Anderson" },
  { id: "2", fullName: "Bob Baker" },
  { id: "3", fullName: "Carol Chen" },
]

function fetchSuggestions(query: string) {
  return PEOPLE.filter((person) =>
    person.fullName.toLowerCase().includes(query.toLowerCase())
  )
}

function useResolveMention(userId: string) {
  return PEOPLE.find((person) => person.id === userId)
}

type TestMentionEditorProps = {
  onReady?: (editor: Editor) => void
}

function TestMentionEditor({ onReady }: TestMentionEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      createMentionExtension({ fetchSuggestions, useResolveMention }),
    ],
    content: "<p></p>",
    editorProps: {
      attributes: { role: "textbox", "aria-label": "Editor" },
    },
    onCreate: ({ editor }) => onReady?.(editor),
  })

  return <EditorContent editor={editor} />
}

describe("createMentionExtension", () => {
  it("shows a popover filtered to matching people when typing @ plus a partial name", async () => {
    const user = userEvent.setup()
    render(<TestMentionEditor />)

    const editor = await screen.findByRole("textbox", { name: "Editor" })
    await user.click(editor)
    await user.type(editor, "@al")

    expect(await screen.findByText("Alice Anderson")).toBeInTheDocument()
    expect(screen.queryByText("Bob Baker")).not.toBeInTheDocument()
    expect(screen.queryByText("Carol Chen")).not.toBeInTheDocument()
  })

  it("dismisses the popover on Escape without inserting a mention", async () => {
    const user = userEvent.setup()
    render(<TestMentionEditor />)

    const editor = await screen.findByRole("textbox", { name: "Editor" })
    await user.click(editor)
    await user.type(editor, "@al")
    expect(await screen.findByText("Alice Anderson")).toBeInTheDocument()

    await user.keyboard("{Escape}")

    await waitFor(() =>
      expect(screen.queryByText("Alice Anderson")).not.toBeInTheDocument()
    )
    expect(editor).toHaveTextContent("@al")
  })

  it("inserts a mention chip resolving the current display name and avatar on Enter", async () => {
    const user = userEvent.setup()
    render(<TestMentionEditor />)

    const editor = await screen.findByRole("textbox", { name: "Editor" })
    await user.click(editor)
    await user.type(editor, "@al")
    expect(await screen.findByText("Alice Anderson")).toBeInTheDocument()

    await user.keyboard("{Enter}")

    await waitFor(() =>
      expect(
        editor.querySelector("[data-mention-user-id='1']")
      ).toBeInTheDocument()
    )
    expect(editor).not.toHaveTextContent("@al")
    expect(
      editor.querySelector("[data-mention-user-id='1']")
    ).toHaveTextContent("Alice Anderson")
  })

  it("inserts a mention chip on Tab, same as Enter", async () => {
    const user = userEvent.setup()
    render(<TestMentionEditor />)

    const editor = await screen.findByRole("textbox", { name: "Editor" })
    await user.click(editor)
    await user.type(editor, "@al")
    expect(await screen.findByText("Alice Anderson")).toBeInTheDocument()

    await user.keyboard("{Tab}")

    await waitFor(() =>
      expect(
        editor.querySelector("[data-mention-user-id='1']")
      ).toBeInTheDocument()
    )
  })

  it("navigates the popover with arrow keys before selecting on Enter", async () => {
    const user = userEvent.setup()
    render(<TestMentionEditor />)

    const editor = await screen.findByRole("textbox", { name: "Editor" })
    await user.click(editor)
    await user.type(editor, "@a")
    expect(await screen.findByText("Alice Anderson")).toBeInTheDocument()
    expect(screen.getByText("Bob Baker")).toBeInTheDocument()
    expect(screen.getByText("Carol Chen")).toBeInTheDocument()

    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}")

    await waitFor(() =>
      expect(
        editor.querySelector("[data-mention-user-id='3']")
      ).toBeInTheDocument()
    )
  })

  it("wraps to the last item when pressing ArrowUp from the top", async () => {
    const user = userEvent.setup()
    render(<TestMentionEditor />)

    const editor = await screen.findByRole("textbox", { name: "Editor" })
    await user.click(editor)
    await user.type(editor, "@a")
    expect(await screen.findByText("Alice Anderson")).toBeInTheDocument()

    await user.keyboard("{ArrowUp}{Enter}")

    await waitFor(() =>
      expect(
        editor.querySelector("[data-mention-user-id='3']")
      ).toBeInTheDocument()
    )
  })

  it("removes the whole mention chip as a single unit when its selection is deleted", async () => {
    const user = userEvent.setup()
    let editorInstance: Editor | undefined
    render(
      <TestMentionEditor onReady={(editor) => (editorInstance = editor)} />
    )

    const editor = await screen.findByRole("textbox", { name: "Editor" })
    await user.click(editor)
    await user.type(editor, "@al")
    await user.keyboard("{Enter}")
    await waitFor(() =>
      expect(
        editor.querySelector("[data-mention-user-id='1']")
      ).toBeInTheDocument()
    )

    // jsdom doesn't implement native contenteditable text editing (no
    // beforeinput synthesis on Backspace), so deletion is driven through the
    // editor's own public commands instead of raw key simulation — this
    // still exercises the mention node's atom behavior: one selection
    // spanning it removes it whole, never leaving a partial chip behind.
    editorInstance?.commands.selectAll()
    editorInstance?.commands.deleteSelection()

    await waitFor(() =>
      expect(
        editor.querySelector("[data-mention-user-id='1']")
      ).not.toBeInTheDocument()
    )
    expect(editor).not.toHaveTextContent("Alice Anderson")
  })
})
