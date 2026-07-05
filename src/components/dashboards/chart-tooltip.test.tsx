import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"

import { ChartTooltip } from "@/components/dashboards/chart-tooltip"

describe("ChartTooltip", () => {
  it("renders nothing when inactive", () => {
    const { container } = render(
      <ChartTooltip
        active={false}
        label="2026-07-01"
        payload={[{ name: "Remaining work", value: 5 }]}
      />
    )

    expect(container).toBeEmptyDOMElement()
  })

  it("renders nothing when there is no payload", () => {
    const { container } = render(<ChartTooltip active label="2026-07-01" />)

    expect(container).toBeEmptyDOMElement()
  })

  it("renders the label and each payload entry's name and value", () => {
    render(
      <ChartTooltip
        active
        label="2026-07-01"
        payload={[
          { name: "Remaining work", value: 5, color: "red" },
          { name: "Completed", value: 12, color: "blue" },
        ]}
      />
    )

    expect(screen.getByText("2026-07-01")).toBeInTheDocument()
    expect(screen.getByText("Remaining work")).toBeInTheDocument()
    expect(screen.getByText("5")).toBeInTheDocument()
    expect(screen.getByText("Completed")).toBeInTheDocument()
    expect(screen.getByText("12")).toBeInTheDocument()
  })

  it("formats the label and values with the provided formatters", () => {
    render(
      <ChartTooltip
        active
        label="2026-07-01"
        payload={[{ name: "Remaining work", value: 5 }]}
        labelFormatter={(label) => `On ${label}`}
        valueFormatter={(value, name) => `${value} (${name})`}
      />
    )

    expect(screen.getByText("On 2026-07-01")).toBeInTheDocument()
    expect(screen.getByText("5 (Remaining work)")).toBeInTheDocument()
  })
})
