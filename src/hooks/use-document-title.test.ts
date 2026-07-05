import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { useDocumentTitle } from "@/hooks/use-document-title"

describe("useDocumentTitle", () => {
  it("sets the document title with the Mirai suffix", () => {
    renderHook(() => useDocumentTitle("Boards"))

    expect(document.title).toBe("Boards - Mirai")
  })

  it("falls back to just Mirai when no title is given", () => {
    renderHook(() => useDocumentTitle())

    expect(document.title).toBe("Mirai")
  })

  it("updates the title when it changes across renders", () => {
    const { rerender } = renderHook(
      ({ title }: { title?: string }) => useDocumentTitle(title),
      { initialProps: { title: "Boards" } }
    )

    expect(document.title).toBe("Boards - Mirai")

    rerender({ title: "Sprints" })

    expect(document.title).toBe("Sprints - Mirai")
  })
})
