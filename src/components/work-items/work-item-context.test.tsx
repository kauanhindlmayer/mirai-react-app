import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import {
  useWorkItemContext,
  WorkItemProvider,
} from "@/components/work-items/work-item-context"

describe("useWorkItemContext", () => {
  it("throws when used outside a WorkItemProvider", () => {
    expect(() => renderHook(() => useWorkItemContext())).toThrow(
      "useWorkItemContext must be used within a WorkItemProvider"
    )
  })

  it("returns the projectId/workItemId provided by WorkItemProvider", () => {
    const { result } = renderHook(() => useWorkItemContext(), {
      wrapper: ({ children }) => (
        <WorkItemProvider projectId="project-1" workItemId="work-item-1">
          {children}
        </WorkItemProvider>
      ),
    })

    expect(result.current).toEqual({
      projectId: "project-1",
      workItemId: "work-item-1",
    })
  })
})
