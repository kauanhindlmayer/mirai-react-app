import type { ReactNode } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router"
import { Toaster } from "sonner"

import { ThemeProvider } from "@/components/theme-provider"
import { queryClient } from "@/lib/query-client"

import "@/index.css"

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Mirai</title>
        <link rel="icon" type="image/svg+xml" href="/vite.svg" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Outlet />
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
