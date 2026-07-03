import { useMemo, useState } from "react"
import { Link, useParams } from "react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { FileTextIcon, PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { listWikiPages, moveWikiPage } from "@/api/wiki-pages"
import { Tree, type TreeNodeData } from "@/components/common/tree"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { WikiPageSummary } from "@/types/wiki-pages"

function toTreeNodes(
  pages: WikiPageSummary[]
): TreeNodeData<WikiPageSummary>[] {
  return pages.map((page) => ({
    id: page.id,
    data: page,
    children:
      page.subPages && page.subPages.length > 0
        ? toTreeNodes(page.subPages)
        : undefined,
  }))
}

const ROOT_DROPPABLE_ID = "__wiki_page_root__"

export function WikiPageTree() {
  const { projectId, wikiPageId } = useParams<{
    projectId: string
    wikiPageId?: string
  }>()
  const queryClient = useQueryClient()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const { data: pages = [] } = useQuery({
    queryKey: ["wiki-pages", projectId],
    queryFn: () => listWikiPages(projectId!),
    enabled: !!projectId,
    staleTime: 30_000,
    placeholderData: [],
  })

  const nodes = useMemo(() => toTreeNodes(pages), [pages])

  const moveMutation = useMutation({
    mutationFn: ({
      pageId,
      targetParentId,
    }: {
      pageId: string
      targetParentId?: string
    }) =>
      moveWikiPage(projectId!, pageId, { targetParentId, targetPosition: 0 }),
    onError: (error) => {
      toast.error("Failed to move page.", {
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wiki-pages", projectId] })
    },
  })

  function toggle(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const pageId = String(active.id)
    const targetParentId =
      over.id === ROOT_DROPPABLE_ID ? undefined : String(over.id)

    moveMutation.mutate({ pageId, targetParentId })
  }

  return (
    <div className="flex w-64 shrink-0 flex-col gap-2 border-r p-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Wiki Pages</h2>
        <Button variant="ghost" size="icon" className="size-6" asChild>
          <Link
            to={`/projects/${projectId}/wiki-pages/new`}
            aria-label="New wiki page"
          >
            <PlusIcon className="size-3.5" />
          </Link>
        </Button>
      </div>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <RootDropZone />
        <div className="flex-1 overflow-y-auto">
          {nodes.length > 0 ? (
            <Tree
              nodes={nodes}
              expandedIds={expandedIds}
              onToggle={toggle}
              renderLabel={(node) => (
                <WikiPageTreeLabel
                  node={node}
                  isActive={node.data.id === wikiPageId}
                  projectId={projectId!}
                />
              )}
            />
          ) : (
            <p className="px-2 py-4 text-xs text-muted-foreground">
              No wiki pages yet.
            </p>
          )}
        </div>
      </DndContext>
    </div>
  )
}

function RootDropZone() {
  const { setNodeRef, isOver } = useDroppable({ id: ROOT_DROPPABLE_ID })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded border border-dashed px-2 py-1 text-center text-xs text-muted-foreground transition-colors",
        isOver && "border-primary bg-accent text-foreground"
      )}
    >
      Drop here to move to root
    </div>
  )
}

function WikiPageTreeLabel({
  node,
  isActive,
  projectId,
}: {
  node: TreeNodeData<WikiPageSummary>
  isActive: boolean
  projectId: string
}) {
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({ id: node.id })
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: node.id })

  return (
    <Link
      ref={(element) => {
        setDragRef(element)
        setDropRef(element)
      }}
      to={`/projects/${projectId}/wiki-pages/${node.id}`}
      draggable={false}
      onDragStart={(event) => event.preventDefault()}
      style={{
        transform: CSS.Translate.toString(transform),
        touchAction: "none",
      }}
      {...attributes}
      {...listeners}
      className={cn(
        "flex flex-1 cursor-grab items-center gap-1.5 truncate rounded px-1.5 py-1 text-sm active:cursor-grabbing",
        isActive && "bg-accent font-medium",
        isOver && "bg-accent/70 ring-1 ring-primary",
        isDragging &&
          "relative z-10 bg-popover opacity-90 shadow-lg ring-1 ring-border"
      )}
    >
      <FileTextIcon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate">{node.data.title}</span>
    </Link>
  )
}
