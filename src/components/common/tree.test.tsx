import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Tree, type TreeNodeData } from "@/components/common/tree"

type NodeData = { label: string }

function buildNodes(): TreeNodeData<NodeData>[] {
  return [
    {
      id: "parent",
      data: { label: "Parent" },
      children: [{ id: "child", data: { label: "Child" } }],
    },
    { id: "leaf", data: { label: "Leaf" } },
  ]
}

describe("Tree", () => {
  it("renders top-level node labels", () => {
    render(
      <Tree
        nodes={buildNodes()}
        renderLabel={(node) => node.data.label}
        expandedIds={new Set()}
        onToggle={vi.fn()}
      />
    )

    expect(screen.getByText("Parent")).toBeInTheDocument()
    expect(screen.getByText("Leaf")).toBeInTheDocument()
  })

  it("does not render a child node's label until its parent is expanded", () => {
    render(
      <Tree
        nodes={buildNodes()}
        renderLabel={(node) => node.data.label}
        expandedIds={new Set()}
        onToggle={vi.fn()}
      />
    )

    expect(screen.queryByText("Child")).not.toBeInTheDocument()
  })

  it("renders a child node's label when its parent id is in expandedIds", () => {
    render(
      <Tree
        nodes={buildNodes()}
        renderLabel={(node) => node.data.label}
        expandedIds={new Set(["parent"])}
        onToggle={vi.fn()}
      />
    )

    expect(screen.getByText("Child")).toBeInTheDocument()
  })

  it("does not render an expand toggle for a leaf node", () => {
    render(
      <Tree
        nodes={[{ id: "leaf", data: { label: "Leaf" } }]}
        renderLabel={(node) => node.data.label}
        expandedIds={new Set()}
        onToggle={vi.fn()}
      />
    )

    expect(
      screen.queryByRole("button", { name: "Expand" })
    ).not.toBeInTheDocument()
  })

  it("calls onToggle with the node id when its expand button is clicked", async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(
      <Tree
        nodes={buildNodes()}
        renderLabel={(node) => node.data.label}
        expandedIds={new Set()}
        onToggle={onToggle}
      />
    )

    await user.click(screen.getByRole("button", { name: "Expand" }))

    expect(onToggle).toHaveBeenCalledWith("parent")
  })
})
