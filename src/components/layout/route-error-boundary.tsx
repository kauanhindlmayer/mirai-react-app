import { Component, type ErrorInfo, type ReactNode } from "react"

type RouteErrorBoundaryProps = {
  children: ReactNode
}

type RouteErrorBoundaryState = {
  error: Error | null
}

export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Route render error:", error, errorInfo)
  }

  render() {
    const { error } = this.state

    if (error) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="max-w-lg text-sm break-words text-muted-foreground">
            {error.message}
          </p>
          <pre className="max-w-2xl overflow-auto rounded-md border bg-muted p-4 text-left text-xs text-muted-foreground">
            {error.stack}
          </pre>
        </div>
      )
    }

    return this.props.children
  }
}
