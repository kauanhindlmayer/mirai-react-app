import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { ChartTooltip } from "@/components/dashboards/chart-tooltip"
import type { BurnupPoint } from "@/types/dashboards"

function formatDate(value: string | number) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}

export function BurnupChart({ data }: { data: BurnupPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="0"
          vertical={false}
          stroke="var(--chart-gridline)"
        />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
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
        <Tooltip content={<ChartTooltip labelFormatter={formatDate} />} />
        <Legend
          wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }}
          iconType="plainline"
        />
        <Line
          type="monotone"
          dataKey="totalWork"
          name="Total scope"
          stroke="var(--chart-2)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="completedWork"
          name="Completed"
          stroke="var(--chart-1)"
          strokeWidth={2}
          dot={{
            r: 4,
            strokeWidth: 2,
            stroke: "var(--popover)",
            fill: "var(--chart-1)",
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
