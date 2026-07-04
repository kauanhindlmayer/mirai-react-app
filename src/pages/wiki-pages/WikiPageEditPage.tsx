import { useState } from "react"
import { useNavigate, useParams } from "react-router"

import { ErrorState } from "@/components/common/error-state"
import { WikiPageEditor } from "@/components/wiki-pages/wiki-page-editor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import {
  useUpdateWikiPageMutation,
  useWikiPageQuery,
} from "@/queries/wiki-pages"
import type { WikiPage } from "@/types/wiki-pages"

export default function WikiPageEditPage() {
  const { projectId, wikiPageId } = useParams<{
    projectId: string
    wikiPageId: string
  }>()

  const {
    data: wikiPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useWikiPageQuery(projectId, wikiPageId)
  if (isError) {
    return (
      <ErrorState
        error={error}
        title="Failed to load wiki page"
        onRetry={() => refetch()}
      />
    )
  }

  if (isLoading || !wikiPage) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <WikiPageEditForm
      key={wikiPage.id}
      projectId={projectId!}
      wikiPageId={wikiPageId!}
      wikiPage={wikiPage}
    />
  )
}

function WikiPageEditForm({
  projectId,
  wikiPageId,
  wikiPage,
}: {
  projectId: string
  wikiPageId: string
  wikiPage: WikiPage
}) {
  const navigate = useNavigate()
  const [title, setTitle] = useState(wikiPage.title)
  const [content, setContent] = useState(wikiPage.content)

  const mutation = useUpdateWikiPageMutation(projectId, wikiPageId)

  function handleSave() {
    mutation.mutate(
      { title, content },
      {
        onSuccess: () => {
          navigate(`/projects/${projectId}/wiki-pages/${wikiPageId}`)
        },
      }
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-4">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Page title"
          className="border-none px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
        />
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            onClick={() =>
              navigate(`/projects/${projectId}/wiki-pages/${wikiPageId}`)
            }
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || mutation.isPending}
          >
            {mutation.isPending ? <Spinner data-icon="inline-end" /> : null}
            Save
          </Button>
        </div>
      </div>
      <WikiPageEditor content={content} onChange={setContent} />
    </div>
  )
}
