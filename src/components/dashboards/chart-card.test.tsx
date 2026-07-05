import { describe, expect, it, vi } from "vitest"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { ChartCard } from "@/components/dashboards/chart-card"
import { renderWithProviders } from "@/test/test-utils"

describe("ChartCard", () => {
  it("renders the title and children when loaded", () => {
    renderWithProviders(
      <ChartCard title="Burndown" isLoading={false}>
        <p>Chart content</p>
      </ChartCard>
    )

    expect(screen.getByText("Burndown")).toBeInTheDocument()
    expect(screen.getByText("Chart content")).toBeInTheDocument()
  })

  it("shows a loading skeleton instead of children while loading", () => {
    renderWithProviders(
      <ChartCard title="Burndown" isLoading>
        <p>Chart content</p>
      </ChartCard>
    )

    expect(screen.queryByText("Chart content")).not.toBeInTheDocument()
  })

  it("shows an empty-state message when there is no data for the period", () => {
    renderWithProviders(
      <ChartCard title="Burndown" isLoading={false} isEmpty>
        <p>Chart content</p>
      </ChartCard>
    )

    expect(screen.getByText("No data for this period.")).toBeInTheDocument()
    expect(screen.queryByText("Chart content")).not.toBeInTheDocument()
  })

  it("shows an error state with a retry action when loading fails", async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(
      <ChartCard title="Burndown" isLoading={false} isError onRetry={onRetry}>
        <p>Chart content</p>
      </ChartCard>
    )

    expect(screen.getByText("Failed to load chart")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /try again/i }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
