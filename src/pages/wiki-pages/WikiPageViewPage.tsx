import { Link, useNavigate, useParams } from "react-router"
import { PencilIcon } from "lucide-react"

import { DeleteWikiPageDialog } from "@/components/wiki-pages/delete-wiki-page-dialog"
import { ErrorState } from "@/components/common/error-state"
import { WikiPageComments } from "@/components/wiki-pages/wiki-page-comments"
import { WikiPageEditor } from "@/components/wiki-pages/wiki-page-editor"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getAvatarUrl } from "@/lib/get-avatar-url"
import { getInitials } from "@/lib/utils"
import { useWikiPageQuery } from "@/queries/wiki-pages"

export default function WikiPageViewPage() {
  const { projectId, wikiPageId } = useParams<{
    projectId: string
    wikiPageId: string
  }>()
  const navigate = useNavigate()

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

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!wikiPage) return null

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">{wikiPage.title}</h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Avatar className="size-5">
              <AvatarImage
                src={getAvatarUrl(wikiPage.author.imageUrl)}
                alt={wikiPage.author.name}
              />
              <AvatarFallback>
                {getInitials(wikiPage.author.name)}
              </AvatarFallback>
            </Avatar>
            <span>{wikiPage.author.name}</span>
            <span>&middot;</span>
            <span>
              {new Date(
                wikiPage.updatedAtUtc ?? wikiPage.createdAtUtc
              ).toLocaleString()}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/projects/${projectId}/wiki-pages/${wikiPageId}/edit`}>
              <PencilIcon />
              Edit
            </Link>
          </Button>
          <DeleteWikiPageDialog
            projectId={projectId!}
            wikiPageId={wikiPageId!}
            title={wikiPage.title}
            onDeleted={() => navigate(`/projects/${projectId}/wiki-pages`)}
          />
        </div>
      </div>
      <WikiPageEditor
        key={wikiPage.id}
        content={wikiPage.content}
        editable={false}
      />
      <WikiPageComments
        projectId={projectId!}
        wikiPageId={wikiPageId!}
        comments={wikiPage.comments}
      />
    </div>
  )
}
