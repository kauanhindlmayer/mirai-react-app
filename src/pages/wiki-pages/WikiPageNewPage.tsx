import { useState } from "react"
import { useNavigate, useParams } from "react-router"

import { WikiPageEditor } from "@/components/wiki-pages/wiki-page-editor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useCreateWikiPageMutation } from "@/queries/wiki-pages"

export default function WikiPageNewPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")

  const mutation = useCreateWikiPageMutation(projectId!)

  function handleCreate() {
    mutation.mutate(
      { title, content },
      {
        onSuccess: (wikiPageId) => {
          navigate(`/projects/${projectId}/wiki-pages/${wikiPageId}`)
        },
      }
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Page title"
          className="border-none px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
        />
        <Button
          onClick={handleCreate}
          disabled={!title.trim() || mutation.isPending}
        >
          {mutation.isPending ? <Spinner data-icon="inline-end" /> : null}
          Create
        </Button>
      </div>
      <WikiPageEditor content={content} onChange={setContent} />
    </div>
  )
}
