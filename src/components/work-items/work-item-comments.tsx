import { type FormEvent, useState } from "react"

import { useCurrentUserQuery } from "@/hooks/use-auth"
import {
  useAddWorkItemCommentMutation,
  useDeleteWorkItemCommentMutation,
  useUpdateWorkItemCommentMutation,
} from "@/queries/work-items"
import type { Comment } from "@/types/common"
import { getAvatarUrl } from "@/lib/get-avatar-url"
import { getInitials } from "@/lib/utils"
import { useWorkItemContext } from "@/components/work-items/work-item-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"

type WorkItemCommentsProps = {
  comments: Comment[]
}

export function WorkItemComments({ comments }: WorkItemCommentsProps) {
  const { projectId, workItemId } = useWorkItemContext()
  const { data: currentUser } = useCurrentUserQuery()
  const [draft, setDraft] = useState("")
  const addComment = useAddWorkItemCommentMutation(projectId, workItemId)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!draft.trim()) return
    addComment.mutate({ content: draft }, { onSuccess: () => setDraft("") })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
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
  comment,
  canEdit,
}: {
  comment: Comment
  canEdit: boolean
}) {
  const { projectId, workItemId } = useWorkItemContext()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(comment.content)
  const updateComment = useUpdateWorkItemCommentMutation(projectId, workItemId)
  const deleteComment = useDeleteWorkItemCommentMutation(projectId, workItemId)

  function handleSave() {
    if (!draft.trim()) return
    updateComment.mutate(
      { commentId: comment.id, request: { content: draft } },
      { onSuccess: () => setIsEditing(false) }
    )
  }

  return (
    <div className="flex gap-3">
      <Avatar className="size-7">
        <AvatarImage
          src={getAvatarUrl(comment.author.imageUrl)}
          alt={comment.author.name}
        />
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
                onClick={handleSave}
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
              onClick={() => deleteComment.mutate(comment.id)}
            >
              Delete
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
