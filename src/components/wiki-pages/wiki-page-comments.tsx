import { type FormEvent, useState } from "react"

import { useCurrentUserQuery } from "@/hooks/use-auth"
import { getInitials } from "@/lib/utils"
import {
  useAddWikiPageCommentMutation,
  useDeleteWikiPageCommentMutation,
  useUpdateWikiPageCommentMutation,
} from "@/queries/wiki-pages"
import type { Comment } from "@/types/common"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"

type WikiPageCommentsProps = {
  projectId: string
  wikiPageId: string
  comments: Comment[]
}

export function WikiPageComments({
  projectId,
  wikiPageId,
  comments,
}: WikiPageCommentsProps) {
  const { data: currentUser } = useCurrentUserQuery()
  const [draft, setDraft] = useState("")

  const addComment = useAddWikiPageCommentMutation(projectId, wikiPageId)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!draft.trim()) return
    addComment.mutate({ content: draft }, { onSuccess: () => setDraft("") })
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold">Comments</h2>
      <div className="flex flex-col gap-3">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              projectId={projectId}
              wikiPageId={wikiPageId}
              comment={comment}
              canEdit={comment.author.id === currentUser?.id}
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <Textarea
          placeholder="Add a comment..."
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button
          type="submit"
          size="sm"
          className="w-fit"
          disabled={!draft.trim() || addComment.isPending}
        >
          {addComment.isPending ? <Spinner data-icon="inline-end" /> : null}
          Comment
        </Button>
      </form>
    </div>
  )
}

function CommentItem({
  projectId,
  wikiPageId,
  comment,
  canEdit,
}: {
  projectId: string
  wikiPageId: string
  comment: Comment
  canEdit: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(comment.content)

  const updateComment = useUpdateWikiPageCommentMutation(projectId, wikiPageId)
  const deleteComment = useDeleteWikiPageCommentMutation(projectId, wikiPageId)

  function handleUpdate() {
    if (!draft.trim()) return
    updateComment.mutate(
      { commentId: comment.id, request: { content: draft } },
      { onSuccess: () => setIsEditing(false) }
    )
  }

  function handleDelete() {
    deleteComment.mutate(comment.id)
  }

  return (
    <div className="flex gap-3">
      <Avatar className="size-7">
        <AvatarImage src={comment.author.imageUrl} alt={comment.author.name} />
        <AvatarFallback>{getInitials(comment.author.name)}</AvatarFallback>
      </Avatar>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{comment.author.name}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(comment.createdAtUtc).toLocaleString()}
          </span>
        </div>
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleUpdate}
                disabled={updateComment.isPending}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
        )}
        {canEdit && !isEditing ? (
          <div className="flex gap-2">
            <button
              type="button"
              className="text-xs text-muted-foreground hover:underline"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </button>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:underline"
              onClick={handleDelete}
            >
              Delete
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
