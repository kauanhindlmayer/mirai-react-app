import { CommentThread } from "@/components/common/comment-thread"
import {
  useAddWikiPageCommentMutation,
  useDeleteWikiPageCommentMutation,
  useUpdateWikiPageCommentMutation,
} from "@/queries/wiki-pages"
import type { Comment } from "@/types/common"

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
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold">Comments</h2>
      <CommentThread
        comments={comments}
        addComment={useAddWikiPageCommentMutation(projectId, wikiPageId)}
        updateComment={useUpdateWikiPageCommentMutation(projectId, wikiPageId)}
        deleteComment={useDeleteWikiPageCommentMutation(projectId, wikiPageId)}
      />
    </div>
  )
}
