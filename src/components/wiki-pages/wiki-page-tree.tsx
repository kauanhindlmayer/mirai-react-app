import { useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  pointerWithin,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { FileTextIcon, PlusIcon } from "lucide-react"

import { Tree, type TreeNodeData } from "@/components/common/tree"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  useMoveWikiPageMutation,
  useWikiPagesQuery,
} from "@/queries/wiki-pages"
import type { WikiPageSummary } from "@/types/wiki-pages"
import {
  ROOT_DROPPABLE_ID,
  afterDropId,
  beforeDropId,
  buildPageMetaIndex,
  findPage,
  insideDropId,
  isValidDropTarget,
  parseDropTarget,
  resolveMoveTarget,
  toTreeNodes,
} from "@/components/wiki-pages/wiki-page-tree-utils"

export function WikiPageTree() {
  const { projectId, wikiPageId } = useParams<{
    projectId: string
    wikiPageId?: string
  }>()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [activeId, setActiveId] = useState<string | null>(null)

  const { data: pages = [] } = useWikiPagesQuery(projectId)

  const nodes = useMemo(() => toTreeNodes(pages), [pages])
  const pageMeta = useMemo(() => buildPageMetaIndex(pages), [pages])

  const disabledDropIds = useMemo(() => {
    if (!activeId) return new Set<string>()
    const descendantIds = pageMeta.get(activeId)?.descendantIds ?? new Set()
    return new Set([activeId, ...descendantIds])
  }, [activeId, pageMeta])

  const moveMutation = useMoveWikiPageMutation(projectId!)

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

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    const dropTarget = parseDropTarget(String(over.id))
    if (!dropTarget) return

    const pageId = String(active.id)
    if (!isValidDropTarget(pageId, dropTarget, pageMeta)) return

    const moveTarget = resolveMoveTarget(dropTarget, pages, pageMeta)
    if (!moveTarget) return

    moveMutation.mutate({ wikiPageId: pageId, request: moveTarget })
  }

  const activePage = activeId ? findPage(pages, activeId) : undefined

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
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
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
                  isDropDisabled={disabledDropIds.has(node.data.id)}
                  isAnyDragActive={activeId !== null}
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
        <DragOverlay>
          {activePage ? (
            <div className="flex items-center gap-1.5 rounded bg-popover px-1.5 py-1 text-sm shadow-lg ring-1 ring-border">
              <FileTextIcon className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{activePage.title}</span>
            </div>
          ) : null}
        </DragOverlay>
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

type WikiPageTreeLabelProps = {
  node: TreeNodeData<WikiPageSummary>
  isActive: boolean
  isDropDisabled: boolean
  isAnyDragActive: boolean
  projectId: string
}

function WikiPageTreeLabel({
  node,
  isActive,
  isDropDisabled,
  isAnyDragActive,
  projectId,
}: WikiPageTreeLabelProps) {
  const navigate = useNavigate()
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({ id: node.id })
  const { setNodeRef: setBeforeRef, isOver: isBeforeOver } = useDroppable({
    id: beforeDropId(node.id),
    disabled: isDropDisabled,
  })
  const { setNodeRef: setAfterRef, isOver: isAfterOver } = useDroppable({
    id: afterDropId(node.id),
    disabled: isDropDisabled,
  })
  const { setNodeRef: setInsideRef, isOver: isInsideOver } = useDroppable({
    id: insideDropId(node.id),
    disabled: isDropDisabled,
  })

  function navigateToPage() {
    navigate(`/projects/${projectId}/wiki-pages/${node.id}`)
  }

  return (
    <div className="relative min-w-0 flex-1">
      <div
        ref={setBeforeRef}
        className={cn(
          "absolute inset-x-0 top-0 z-10 h-1/3",
          isAnyDragActive && !isDropDisabled
            ? "pointer-events-auto"
            : "pointer-events-none"
        )}
      />
      <div
        ref={setAfterRef}
        className={cn(
          "absolute inset-x-0 bottom-0 z-10 h-1/3",
          isAnyDragActive && !isDropDisabled
            ? "pointer-events-auto"
            : "pointer-events-none"
        )}
      />
      <div
        ref={(element) => {
          setDragRef(element)
          setInsideRef(element)
        }}
        draggable={false}
        onDragStart={(event) => event.preventDefault()}
        onClick={navigateToPage}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            navigateToPage()
          }
        }}
        {...attributes}
        {...listeners}
        className={cn(
          "flex min-w-0 flex-1 cursor-grab items-center gap-1.5 rounded px-1.5 py-1 text-sm active:cursor-grabbing",
          isActive && "bg-accent font-medium",
          isInsideOver && !isDropDisabled && "bg-accent/70 ring-1 ring-primary",
          isDragging && "opacity-40"
        )}
      >
        <FileTextIcon className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate">{node.data.title}</span>
      </div>
      {isBeforeOver && !isDropDisabled ? (
        <div className="pointer-events-none absolute inset-x-1.5 top-0 z-20 h-0.5 rounded-full bg-primary" />
      ) : null}
      {isAfterOver && !isDropDisabled ? (
        <div className="pointer-events-none absolute inset-x-1.5 bottom-0 z-20 h-0.5 rounded-full bg-primary" />
      ) : null}
    </div>
  )
}
