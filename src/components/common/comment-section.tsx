import { type FormEvent, useState } from "react"
import type { UseMutationResult } from "@tanstack/react-query"

import { useCurrentUserQuery } from "@/hooks/use-auth"
import { MentionableEditor } from "@/components/common/mentionable-editor"
import { getAvatarUrl } from "@/lib/get-avatar-url"
import { getInitials, isEditorContentEmpty } from "@/lib/utils"
import type {
  AddCommentRequest,
  Comment,
  UpdateCommentRequest,
} from "@/types/common"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

type UpdateCommentVariables = {
  commentId: string
  request: UpdateCommentRequest
}

type CommentSectionProps = {
  comments: Comment[]
  addComment: UseMutationResult<void, unknown, AddCommentRequest>
  updateComment: UseMutationResult<void, unknown, UpdateCommentVariables>
  deleteComment: UseMutationResult<void, unknown, string>
}

export function CommentSection({
  comments,
  addComment,
  updateComment,
  deleteComment,
}: CommentSectionProps) {
  const { data: currentUser } = useCurrentUserQuery()
  const [draft, setDraft] = useState("")
  const [composerKey, setComposerKey] = useState(0)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (isEditorContentEmpty(draft)) return
    addComment.mutate(
      { content: draft },
      {
        onSuccess: () => {
          setDraft("")
          // Tiptap only reads `content` at mount, so clearing the draft
          // state alone wouldn't visually clear the editor - remount it.
          setComposerKey((key) => key + 1)
        },
      }
    )
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
              updateComment={updateComment}
              deleteComment={deleteComment}
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="rounded-md border px-3 py-2">
          <MentionableEditor
            key={composerKey}
            content={draft}
            onChange={setDraft}
            placeholder="Add a comment..."
            ariaLabel="Add a comment"
          />
        </div>
        <Button
          type="submit"
          size="sm"
          className="w-fit"
          disabled={isEditorContentEmpty(draft) || addComment.isPending}
        >
          {addComment.isPending ? <Spinner data-icon="inline-end" /> : null}
          Comment
        </Button>
      </form>
    </div>
  )
}

type CommentItemProps = {
  comment: Comment
  canEdit: boolean
  updateComment: UseMutationResult<void, unknown, UpdateCommentVariables>
  deleteComment: UseMutationResult<void, unknown, string>
}

function CommentItem({
  comment,
  canEdit,
  updateComment,
  deleteComment,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(comment.content)

  function handleSave() {
    if (isEditorContentEmpty(draft)) return
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
            <div className="rounded-md border px-3 py-2">
              <MentionableEditor
                content={draft}
                onChange={setDraft}
                ariaLabel="Edit comment"
              />
            </div>
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
          // Rendered through Tiptap (not dangerouslySetInnerHTML) so mention
          // chips go through their own node view and resolve live, rather
          // than showing whatever name was frozen into the HTML at save time.
          <MentionableEditor content={comment.content} editable={false} />
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
