import { type ChangeEvent, useRef } from "react"
import { DownloadIcon, PaperclipIcon, TrashIcon } from "lucide-react"

import { downloadWorkItemAttachment } from "@/api/work-items"
import {
  useDeleteWorkItemAttachment,
  useUploadWorkItemAttachment,
} from "@/queries/work-items"
import type { WorkItemAttachment } from "@/types/work-items"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type WorkItemAttachmentsProps = {
  projectId: string
  workItemId: string
  attachments: WorkItemAttachment[]
}

export function WorkItemAttachments({
  projectId,
  workItemId,
  attachments,
}: WorkItemAttachmentsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadAttachment = useUploadWorkItemAttachment(projectId, workItemId)
  const deleteAttachment = useDeleteWorkItemAttachment(projectId, workItemId)

  async function handleDownload(attachment: WorkItemAttachment) {
    const blob = await downloadWorkItemAttachment(
      projectId,
      workItemId,
      attachment.id
    )
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = attachment.fileName
    link.click()
    URL.revokeObjectURL(url)
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    uploadAttachment.mutate(file)
    event.target.value = ""
  }

  return (
    <div className="flex flex-col gap-2">
      {attachments.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {attachments.map((attachment) => (
            <li
              key={attachment.id}
              className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm"
            >
              <PaperclipIcon className="size-3.5 text-muted-foreground" />
              <span className="flex-1 truncate">{attachment.fileName}</span>
              <span className="text-xs text-muted-foreground">
                {formatFileSize(attachment.fileSizeBytes)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={() => handleDownload(attachment)}
                aria-label={`Download ${attachment.fileName}`}
              >
                <DownloadIcon className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={() => deleteAttachment.mutate(attachment.id)}
                aria-label={`Delete ${attachment.fileName}`}
              >
                <TrashIcon className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No attachments yet.</p>
      )}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploadAttachment.isPending}
      >
        {uploadAttachment.isPending ? (
          <Spinner data-icon="inline-end" />
        ) : (
          <PaperclipIcon />
        )}
        Attach file
      </Button>
    </div>
  )
}
