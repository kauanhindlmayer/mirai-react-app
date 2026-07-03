import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

function formatDate(value: string | number) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}

type ScatterPoint = {
  x: number
  y: number
  title: string
  type: string
}

function ScatterPointTooltip({
  active,
  payload,
  yLabel,
}: {
  active?: boolean
  payload?: { payload: ScatterPoint }[]
  yLabel: string
}) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0].payload

  return (
    <div className="max-w-56 rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 truncate font-medium text-popover-foreground">
        {point.title}
      </p>
      <div className="flex items-center justify-between gap-4 text-muted-foreground">
        <span>{point.type}</span>
        <span className="font-semibold text-popover-foreground">
          {point.y} {point.y === 1 ? "day" : "days"}
        </span>
      </div>
      <p className="mt-1 text-muted-foreground">
        Completed {formatDate(point.x)} · {yLabel}
      </p>
    </div>
  )
}

type WorkItemScatterChartProps = {
  points: ScatterPoint[]
  yLabel: string
}

export function WorkItemScatterChart({
  points,
  yLabel,
}: WorkItemScatterChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="0" stroke="var(--chart-gridline)" />
        <XAxis
          dataKey="x"
          type="number"
          domain={["auto", "auto"]}
          tickFormatter={formatDate}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
        />
        <YAxis
          dataKey="y"
          type="number"
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={32}
        />
        <Tooltip
          content={<ScatterPointTooltip yLabel={yLabel} />}
          cursor={{ strokeDasharray: "3 3", stroke: "var(--border)" }}
        />
        <Scatter data={points} fill="var(--chart-1)" />
      </ScatterChart>
    </ResponsiveContainer>
  )
}
