import { describe, expect, it } from "vitest"

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
} from "@/components/wiki-pages/wiki-page-tree-utils"

function buildTree(): WikiPageSummary[] {
  return [
    {
      id: "a",
      title: "A",
      position: 0,
      subPages: [
        { id: "a1", title: "A1", position: 0 },
        { id: "a2", title: "A2", position: 1 },
      ],
    },
    { id: "b", title: "B", position: 1 },
    { id: "c", title: "C", position: 2 },
  ]
}

describe("parseDropTarget", () => {
  it("recognizes the root drop zone", () => {
    expect(parseDropTarget(ROOT_DROPPABLE_ID)).toEqual({ type: "root" })
  })

  it("parses before/after/inside ids back to their page id", () => {
    expect(parseDropTarget(beforeDropId("page-1"))).toEqual({
      type: "before",
      pageId: "page-1",
    })
    expect(parseDropTarget(afterDropId("page-1"))).toEqual({
      type: "after",
      pageId: "page-1",
    })
    expect(parseDropTarget(insideDropId("page-1"))).toEqual({
      type: "inside",
      pageId: "page-1",
    })
  })

  it("returns undefined for an unrecognized id", () => {
    expect(parseDropTarget("something-else")).toBeUndefined()
  })
})

describe("buildPageMetaIndex", () => {
  it("records each page's parent, siblings, and descendants", () => {
    const index = buildPageMetaIndex(buildTree())

    expect(index.get("a")).toEqual({
      parentId: undefined,
      siblingIds: ["a", "b", "c"],
      descendantIds: new Set(["a1", "a2"]),
    })
    expect(index.get("a1")).toEqual({
      parentId: "a",
      siblingIds: ["a1", "a2"],
      descendantIds: new Set(),
    })
    expect(index.get("b")).toEqual({
      parentId: undefined,
      siblingIds: ["a", "b", "c"],
      descendantIds: new Set(),
    })
  })
})

describe("findPage", () => {
  it("finds a top-level page", () => {
    expect(findPage(buildTree(), "b")?.title).toBe("B")
  })

  it("finds a nested page", () => {
    expect(findPage(buildTree(), "a1")?.title).toBe("A1")
  })

  it("returns undefined for an unknown id", () => {
    expect(findPage(buildTree(), "missing")).toBeUndefined()
  })
})

describe("isValidDropTarget", () => {
  const pageMeta = buildPageMetaIndex(buildTree())

  it("allows dropping onto the root zone", () => {
    expect(isValidDropTarget("a1", { type: "root" }, pageMeta)).toBe(true)
  })

  it("rejects dropping a page onto itself", () => {
    expect(
      isValidDropTarget("a", { type: "inside", pageId: "a" }, pageMeta)
    ).toBe(false)
  })

  it("rejects dropping a page onto its own descendant", () => {
    expect(
      isValidDropTarget("a", { type: "inside", pageId: "a1" }, pageMeta)
    ).toBe(false)
    expect(
      isValidDropTarget("a", { type: "before", pageId: "a1" }, pageMeta)
    ).toBe(false)
  })

  it("allows dropping a page next to or inside an unrelated page", () => {
    expect(
      isValidDropTarget("a1", { type: "inside", pageId: "b" }, pageMeta)
    ).toBe(true)
    expect(
      isValidDropTarget("b", { type: "after", pageId: "c" }, pageMeta)
    ).toBe(true)
  })
})

describe("resolveMoveTarget", () => {
  const tree = buildTree()
  const pageMeta = buildPageMetaIndex(tree)

  it("moves to the end of the root list when dropped on the root zone", () => {
    expect(resolveMoveTarget({ type: "root" }, tree, pageMeta)).toEqual({
      targetParentId: undefined,
      targetPosition: 3,
    })
  })

  it("nests as the last child when dropped inside a page", () => {
    expect(
      resolveMoveTarget({ type: "inside", pageId: "a" }, tree, pageMeta)
    ).toEqual({ targetParentId: "a", targetPosition: 2 })
  })

  it("nests as the first child when the target page has no children yet", () => {
    expect(
      resolveMoveTarget({ type: "inside", pageId: "b" }, tree, pageMeta)
    ).toEqual({ targetParentId: "b", targetPosition: 0 })
  })

  it("reorders before a sibling at that sibling's index", () => {
    expect(
      resolveMoveTarget({ type: "before", pageId: "c" }, tree, pageMeta)
    ).toEqual({ targetParentId: undefined, targetPosition: 2 })
  })

  it("reorders after a sibling at that sibling's index plus one", () => {
    expect(
      resolveMoveTarget({ type: "after", pageId: "a" }, tree, pageMeta)
    ).toEqual({ targetParentId: undefined, targetPosition: 1 })
  })

  it("reorders relative to a nested sibling using its own parent", () => {
    expect(
      resolveMoveTarget({ type: "after", pageId: "a1" }, tree, pageMeta)
    ).toEqual({ targetParentId: "a", targetPosition: 1 })
  })
})
