type ChartTooltipPayloadEntry = {
  name?: string
  value?: number | string
  color?: string
}

type ChartTooltipProps = {
  active?: boolean
  label?: string | number
  payload?: ChartTooltipPayloadEntry[]
  labelFormatter?: (label: string | number) => string
  valueFormatter?: (value: number | string, name?: string) => string
}

/**
 * Shared recharts tooltip: values lead (bold, primary ink), series names
 * follow (secondary ink), each row keyed by a short line in the series
 * color rather than a filled box.
 */
export function ChartTooltip({
  active,
  label,
  payload,
  labelFormatter,
  valueFormatter,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      {label != null ? (
        <p className="mb-1 font-medium text-popover-foreground">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      ) : null}
      <div className="flex flex-col gap-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <span
              className="h-0.5 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="ml-auto font-semibold text-popover-foreground">
              {valueFormatter
                ? valueFormatter(entry.value ?? "", entry.name)
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
