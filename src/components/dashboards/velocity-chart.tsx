import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { VelocityPoint } from "@/types/dashboards"

function VelocityTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: VelocityPoint }[]
}) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0].payload

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-popover-foreground">
        {point.sprintName}
      </p>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Story points</span>
        <span className="font-semibold text-popover-foreground">
          {point.completedStoryPoints}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Work items</span>
        <span className="font-semibold text-popover-foreground">
          {point.completedWorkItems}
        </span>
      </div>
    </div>
  )
}

export function VelocityChart({ data }: { data: VelocityPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="0"
          vertical={false}
          stroke="var(--chart-gridline)"
        />
        <XAxis
          dataKey="sprintName"
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={32}
        />
        <Tooltip
          content={<VelocityTooltip />}
          cursor={{ fill: "var(--accent)" }}
        />
        <Bar
          dataKey="completedStoryPoints"
          name="Story points"
          fill="var(--chart-1)"
          radius={[4, 4, 0, 0]}
          maxBarSize={24}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
