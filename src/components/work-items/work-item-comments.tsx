import { CommentSection } from "@/components/common/comment-section"
import { useWorkItemContext } from "@/components/work-items/work-item-context"
import {
  useAddWorkItemCommentMutation,
  useDeleteWorkItemCommentMutation,
  useUpdateWorkItemCommentMutation,
} from "@/queries/work-items"
import type { Comment } from "@/types/common"

type WorkItemCommentsProps = {
  comments: Comment[]
}

export function WorkItemComments({ comments }: WorkItemCommentsProps) {
  const { projectId, workItemId } = useWorkItemContext()

  return (
    <CommentSection
      comments={comments}
      addComment={useAddWorkItemCommentMutation(projectId, workItemId)}
      updateComment={useUpdateWorkItemCommentMutation(projectId, workItemId)}
      deleteComment={useDeleteWorkItemCommentMutation(projectId, workItemId)}
    />
  )
}
