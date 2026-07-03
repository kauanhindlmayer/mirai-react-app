import { type FormEvent, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  addWikiPageComment,
  deleteWikiPageComment,
  updateWikiPageComment,
} from "@/api/wiki-pages"
import { useCurrentUser } from "@/hooks/use-auth"
import { getInitials } from "@/lib/utils"
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
  const { data: currentUser } = useCurrentUser()
  const [draft, setDraft] = useState("")
  const queryClient = useQueryClient()

  const addComment = useMutation({
    mutationFn: (content: string) =>
      addWikiPageComment(projectId, wikiPageId, { content }),
    onError: (error) => {
      toast.error("Failed to add comment.", {
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["wiki-page", projectId, wikiPageId],
      })
      setDraft("")
    },
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!draft.trim()) return
    addComment.mutate(draft)
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
  const queryClient = useQueryClient()

  const updateComment = useMutation({
    mutationFn: (content: string) =>
      updateWikiPageComment(projectId, wikiPageId, comment.id, { content }),
    onError: (error) => {
      toast.error("Failed to update comment.", {
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["wiki-page", projectId, wikiPageId],
      })
      setIsEditing(false)
    },
  })

  const deleteComment = useMutation({
    mutationFn: () => deleteWikiPageComment(projectId, wikiPageId, comment.id),
    onError: (error) => {
      toast.error("Failed to delete comment.", {
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["wiki-page", projectId, wikiPageId],
      })
    },
  })

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
                onClick={() => draft.trim() && updateComment.mutate(draft)}
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
              onClick={() => deleteComment.mutate()}
            >
              Delete
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
