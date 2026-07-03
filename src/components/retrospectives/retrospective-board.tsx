import { RetrospectiveColumnCard } from "@/components/retrospectives/retrospective-column"
import type { Retrospective } from "@/types/retrospectives"

export function RetrospectiveBoard({
  retrospective,
}: {
  retrospective: Retrospective
}) {
  return (
    <div className="flex flex-1 items-start gap-4 overflow-x-auto p-1">
      {retrospective.columns.map((column) => (
        <RetrospectiveColumnCard
          key={column.id}
          retrospectiveId={retrospective.id}
          column={column}
        />
      ))}
    </div>
  )
}
