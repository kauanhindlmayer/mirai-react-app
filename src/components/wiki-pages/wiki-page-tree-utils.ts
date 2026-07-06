import type { TreeNodeData } from "@/components/common/tree"
import type { WikiPageSummary } from "@/types/wiki-pages"

export const ROOT_DROPPABLE_ID = "__wiki_page_root__"

const BEFORE_PREFIX = "before:"
const AFTER_PREFIX = "after:"
const INSIDE_PREFIX = "inside:"

export function beforeDropId(pageId: string): string {
  return `${BEFORE_PREFIX}${pageId}`
}

export function afterDropId(pageId: string): string {
  return `${AFTER_PREFIX}${pageId}`
}

export function insideDropId(pageId: string): string {
  return `${INSIDE_PREFIX}${pageId}`
}

export type DropTarget =
  { type: "root" } | { type: "before" | "after" | "inside"; pageId: string }

export function parseDropTarget(overId: string): DropTarget | undefined {
  if (overId === ROOT_DROPPABLE_ID) {
    return { type: "root" }
  }
  if (overId.startsWith(BEFORE_PREFIX)) {
    return { type: "before", pageId: overId.slice(BEFORE_PREFIX.length) }
  }
  if (overId.startsWith(AFTER_PREFIX)) {
    return { type: "after", pageId: overId.slice(AFTER_PREFIX.length) }
  }
  if (overId.startsWith(INSIDE_PREFIX)) {
    return { type: "inside", pageId: overId.slice(INSIDE_PREFIX.length) }
  }
  return undefined
}

export type PageMeta = {
  parentId?: string
  siblingIds: string[]
  descendantIds: Set<string>
}

function collectDescendantIds(page: WikiPageSummary, into: Set<string>) {
  for (const child of page.subPages ?? []) {
    into.add(child.id)
    collectDescendantIds(child, into)
  }
}

export function buildPageMetaIndex(
  pages: WikiPageSummary[]
): Map<string, PageMeta> {
  const index = new Map<string, PageMeta>()

  function walk(nodes: WikiPageSummary[], parentId: string | undefined) {
    const siblingIds = nodes.map((page) => page.id)
    for (const page of nodes) {
      const descendantIds = new Set<string>()
      collectDescendantIds(page, descendantIds)
      index.set(page.id, { parentId, siblingIds, descendantIds })
      if (page.subPages && page.subPages.length > 0) {
        walk(page.subPages, page.id)
      }
    }
  }

  walk(pages, undefined)
  return index
}

export function findPage(
  pages: WikiPageSummary[],
  pageId: string
): WikiPageSummary | undefined {
  for (const page of pages) {
    if (page.id === pageId) return page
    if (page.subPages) {
      const found = findPage(page.subPages, pageId)
      if (found) return found
    }
  }
  return undefined
}

export function isValidDropTarget(
  draggedPageId: string,
  dropTarget: DropTarget,
  pageMeta: Map<string, PageMeta>
): boolean {
  if (dropTarget.type === "root") return true
  if (dropTarget.pageId === draggedPageId) return false

  const draggedMeta = pageMeta.get(draggedPageId)
  if (draggedMeta?.descendantIds.has(dropTarget.pageId)) return false

  return true
}

export type MoveTarget = {
  targetParentId?: string
  targetPosition: number
}

export function resolveMoveTarget(
  dropTarget: DropTarget,
  pages: WikiPageSummary[],
  pageMeta: Map<string, PageMeta>
): MoveTarget | undefined {
  if (dropTarget.type === "root") {
    return { targetParentId: undefined, targetPosition: pages.length }
  }

  if (dropTarget.type === "inside") {
    const targetPage = findPage(pages, dropTarget.pageId)
    if (!targetPage) return undefined
    return {
      targetParentId: dropTarget.pageId,
      targetPosition: targetPage.subPages?.length ?? 0,
    }
  }

  const targetMeta = pageMeta.get(dropTarget.pageId)
  if (!targetMeta) return undefined

  const targetIndex = targetMeta.siblingIds.indexOf(dropTarget.pageId)
  return {
    targetParentId: targetMeta.parentId,
    targetPosition:
      dropTarget.type === "before" ? targetIndex : targetIndex + 1,
  }
}

export function toTreeNodes(
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
