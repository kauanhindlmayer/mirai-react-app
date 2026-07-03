import type { ReactNode } from "react"
import { ChevronRightIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

export type TreeNodeData<T> = {
  id: string
  data: T
  children?: TreeNodeData<T>[]
}

type TreeProps<T> = {
  nodes: TreeNodeData<T>[]
  renderLabel: (node: TreeNodeData<T>) => ReactNode
  expandedIds: Set<string>
  onToggle: (id: string) => void
  depth?: number
}

export function Tree<T>({
  nodes,
  renderLabel,
  expandedIds,
  onToggle,
  depth = 0,
}: TreeProps<T>) {
  return (
    <div className="flex flex-col">
      {nodes.map((node) => (
        <TreeRow
          key={node.id}
          node={node}
          renderLabel={renderLabel}
          expandedIds={expandedIds}
          onToggle={onToggle}
          depth={depth}
        />
      ))}
    </div>
  )
}

function TreeRow<T>({
  node,
  renderLabel,
  expandedIds,
  onToggle,
  depth,
}: {
  node: TreeNodeData<T>
  renderLabel: (node: TreeNodeData<T>) => ReactNode
  expandedIds: Set<string>
  onToggle: (id: string) => void
  depth: number
}) {
  const hasChildren = !!node.children && node.children.length > 0
  const isExpanded = expandedIds.has(node.id)

  return (
    <Collapsible open={isExpanded} onOpenChange={() => onToggle(node.id)}>
      <div
        className="flex items-center gap-1 rounded-md py-1 hover:bg-accent"
        style={{ paddingLeft: `${depth * 1.25}rem` }}
      >
        {hasChildren ? (
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex size-5 shrink-0 items-center justify-center"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              <ChevronRightIcon
                className={cn(
                  "size-3.5 transition-transform",
                  isExpanded && "rotate-90"
                )}
              />
            </button>
          </CollapsibleTrigger>
        ) : (
          <span className="size-5 shrink-0" />
        )}
        {renderLabel(node)}
      </div>
      {hasChildren ? (
        <CollapsibleContent>
          <Tree
            nodes={node.children!}
            renderLabel={renderLabel}
            expandedIds={expandedIds}
            onToggle={onToggle}
            depth={depth + 1}
          />
        </CollapsibleContent>
      ) : null}
    </Collapsible>
  )
}
