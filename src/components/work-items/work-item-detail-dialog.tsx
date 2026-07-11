import { useParams, useSearchParams } from "react-router"
import { ChevronRightIcon, EllipsisVerticalIcon } from "lucide-react"

import { useDraftField } from "@/hooks/use-draft-field"
import {
  useDeleteWorkItemMutation,
  useUpdateWorkItemMutation,
  useWorkItemQuery,
} from "@/queries/work-items"
import { ValueArea, WorkItemStatus, type WorkItem } from "@/types/work-items"
import {
  WORK_ITEM_STATUS_COLORS,
  WORK_ITEM_TYPE_COLORS,
  WORK_ITEM_TYPE_ICONS,
} from "@/lib/work-item-colors"
import { cn } from "@/lib/utils"
import { WorkItemAssigneePicker } from "@/components/work-items/work-item-assignee-picker"
import { WorkItemAttachments } from "@/components/work-items/work-item-attachments"
import { WorkItemComments } from "@/components/work-items/work-item-comments"
import {
  useWorkItemContext,
  WorkItemProvider,
} from "@/components/work-items/work-item-context"
import { WorkItemHistory } from "@/components/work-items/work-item-history"
import { WorkItemLinks } from "@/components/work-items/work-item-links"
import { WorkItemPullRequestLinks } from "@/components/work-items/work-item-pull-request-links"
import { WorkItemTagsEditor } from "@/components/work-items/work-item-tags-editor"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"

export function WorkItemDetailDialog() {
  const { projectId } = useParams<{ projectId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const workItemId = searchParams.get("workItemId")
  const open = !!workItemId && !!projectId

  function handleOpenChange(isOpen: boolean) {
    if (isOpen) return
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete("workItemId")
      return next
    })
  }

  function handleNavigate(nextWorkItemId: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set("workItemId", nextWorkItemId)
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-6xl flex-col gap-0 sm:max-w-6xl">
        {open ? (
          <WorkItemProvider
            key={workItemId}
            projectId={projectId}
            workItemId={workItemId}
          >
            <WorkItemDetailContent
              onDeleted={() => handleOpenChange(false)}
              onNavigate={handleNavigate}
            />
          </WorkItemProvider>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function WorkItemDetailContent({
  onDeleted,
  onNavigate,
}: {
  onDeleted: () => void
  onNavigate: (workItemId: string) => void
}) {
  const { projectId, workItemId } = useWorkItemContext()
  const workItemQuery = useWorkItemQuery(projectId, workItemId)
  const deleteWorkItem = useDeleteWorkItemMutation(projectId)

  if (workItemQuery.isLoading || !workItemQuery.data) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  const workItem = workItemQuery.data
  const TypeIcon = WORK_ITEM_TYPE_ICONS[workItem.type]

  function handleDelete() {
    deleteWorkItem.mutate(workItemId, { onSuccess: onDeleted })
  }

  return (
    <>
      <DialogHeader className="gap-1.5 space-y-0 pr-8">
        <DialogTitle className="sr-only">{workItem.title}</DialogTitle>
        {workItem.parentWorkItem ? (
          <button
            type="button"
            onClick={() => onNavigate(workItem.parentWorkItem!.id)}
            className="flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            #{workItem.parentWorkItem.code} {workItem.parentWorkItem.title}
            <ChevronRightIcon className="size-3" />
          </button>
        ) : null}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "gap-1 border-transparent",
                WORK_ITEM_TYPE_COLORS[workItem.type]
              )}
            >
              <TypeIcon />
              {workItem.type}
            </Badge>
            <span className="text-xs font-medium text-muted-foreground">
              #{workItem.code}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label="More actions"
              >
                <EllipsisVerticalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled>Change Type</DropdownMenuItem>
              <DropdownMenuItem disabled>
                Create Copy of Work Item
              </DropdownMenuItem>
              <DropdownMenuItem disabled>Copy Link</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={handleDelete}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </DialogHeader>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 pt-2 md:grid-cols-[1fr_320px]">
        <div className="-mx-4 min-h-0 overflow-y-auto px-4">
          <div className="flex flex-col gap-4 pb-4">
            <WorkItemMainFields workItem={workItem} />

            {workItem.childWorkItems.length > 0 ? (
              <>
                <Separator />
                <div className="flex flex-col gap-2">
                  <Label>Child work items</Label>
                  <ul className="flex flex-col gap-1">
                    {workItem.childWorkItems.map((child) => (
                      <li key={child.id}>
                        <button
                          type="button"
                          onClick={() => onNavigate(child.id)}
                          className="flex w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-sm hover:bg-accent"
                        >
                          <Badge
                            variant="outline"
                            className={cn(
                              "border-transparent",
                              WORK_ITEM_TYPE_COLORS[child.type]
                            )}
                          >
                            {child.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            #{child.code}
                          </span>
                          <span className="flex-1 truncate">{child.title}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "border-transparent",
                              WORK_ITEM_STATUS_COLORS[child.status]
                            )}
                          >
                            {child.status}
                          </Badge>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : null}

            <Separator />

            <div className="flex flex-col gap-2">
              <Label>Comments</Label>
              <WorkItemComments comments={workItem.comments} />
            </div>
          </div>
        </div>

        <div className="-mx-4 min-h-0 overflow-y-auto border-t px-4 pt-4 md:mx-0 md:border-t-0 md:border-l md:px-4 md:pt-0 md:pl-6">
          <div className="flex flex-col gap-4 pb-4">
            <WorkItemMetaFields workItem={workItem} />

            <Separator />

            <div className="flex flex-col gap-2">
              <Label>Tags</Label>
              <WorkItemTagsEditor tags={workItem.tags} />
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              <Label>Linked work items</Label>
              <WorkItemLinks
                outgoingLinks={workItem.outgoingLinks}
                incomingLinks={workItem.incomingLinks}
              />
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              <Label>Pull requests</Label>
              <WorkItemPullRequestLinks
                pullRequestLinks={workItem.pullRequestLinks}
              />
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              <Label>Attachments</Label>
              <WorkItemAttachments attachments={workItem.attachments} />
            </div>

            <Separator />

            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              <span>
                Created {new Date(workItem.createdAtUtc).toLocaleString()}
              </span>
              {workItem.updatedAtUtc ? (
                <span>
                  Updated {new Date(workItem.updatedAtUtc).toLocaleString()}
                </span>
              ) : null}
            </div>

            <WorkItemHistory />
          </div>
        </div>
      </div>
    </>
  )
}

function WorkItemMainFields({ workItem }: { workItem: WorkItem }) {
  const { projectId, workItemId } = useWorkItemContext()
  const updateWorkItem = useUpdateWorkItemMutation(projectId, workItemId)

  const titleField = useDraftField(workItem.title, (next) => {
    if (next.trim()) updateWorkItem.mutate({ title: next })
  })
  const descriptionField = useDraftField(workItem.description ?? "", (next) => {
    updateWorkItem.mutate({ description: next })
  })
  const acceptanceCriteriaField = useDraftField(
    workItem.acceptanceCriteria ?? "",
    (next) => {
      updateWorkItem.mutate({ acceptanceCriteria: next })
    }
  )

  return (
    <div className="flex flex-col gap-3">
      <Input
        value={titleField.draft}
        onChange={(event) => titleField.setDraft(event.target.value)}
        onBlur={titleField.commit}
        className="border-none px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
      />
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Description</Label>
        <Textarea
          value={descriptionField.draft}
          onChange={(event) => descriptionField.setDraft(event.target.value)}
          onBlur={descriptionField.commit}
          placeholder="Add a description..."
          className="min-h-28"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">
          Acceptance criteria
        </Label>
        <Textarea
          value={acceptanceCriteriaField.draft}
          onChange={(event) =>
            acceptanceCriteriaField.setDraft(event.target.value)
          }
          onBlur={acceptanceCriteriaField.commit}
          placeholder="Add acceptance criteria..."
          className="min-h-20"
        />
      </div>
    </div>
  )
}

function WorkItemMetaFields({ workItem }: { workItem: WorkItem }) {
  const { projectId, workItemId } = useWorkItemContext()
  const updateWorkItem = useUpdateWorkItemMutation(projectId, workItemId)

  const storyPointsField = useDraftField(
    workItem.planning?.storyPoints?.toString() ?? "",
    (next) => {
      const parsed = next.trim() ? Number(next) : undefined
      if (parsed === workItem.planning?.storyPoints) return
      updateWorkItem.mutate({
        planning: { ...workItem.planning, storyPoints: parsed },
      })
    }
  )
  const priorityField = useDraftField(
    workItem.planning?.priority?.toString() ?? "",
    (next) => {
      const parsed = next.trim() ? Number(next) : undefined
      if (parsed === workItem.planning?.priority) return
      updateWorkItem.mutate({
        planning: { ...workItem.planning, priority: parsed },
      })
    }
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Assignee</Label>
        <WorkItemAssigneePicker assignee={workItem.assignee} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Status</Label>
        <Select
          value={workItem.status}
          onValueChange={(value) =>
            updateWorkItem.mutate({ status: value as WorkItemStatus })
          }
        >
          <SelectTrigger
            className={cn(
              "w-full border-transparent",
              WORK_ITEM_STATUS_COLORS[workItem.status]
            )}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(WorkItemStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Story points</Label>
          <Input
            type="number"
            min={0}
            value={storyPointsField.draft}
            onChange={(event) => storyPointsField.setDraft(event.target.value)}
            onBlur={storyPointsField.commit}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Priority</Label>
          <Input
            type="number"
            min={0}
            value={priorityField.draft}
            onChange={(event) => priorityField.setDraft(event.target.value)}
            onBlur={priorityField.commit}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Value area</Label>
        <Select
          value={workItem.classification?.valueArea}
          onValueChange={(value) =>
            updateWorkItem.mutate({
              classification: { valueArea: value as ValueArea },
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(ValueArea).map((area) => (
              <SelectItem key={area} value={area}>
                {area}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
