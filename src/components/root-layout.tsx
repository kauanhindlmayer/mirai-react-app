import { Fragment } from "react"
import { Outlet, Link } from "react-router"

import { AppSidebar } from "@/components/app-sidebar"
import { GlobalSearch } from "@/components/global-search"
import { KeyboardShortcutsDialog } from "@/components/keyboard-shortcuts-dialog"
import { RouteErrorBoundary } from "@/components/route-error-boundary"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs"

export default function RootLayout() {
  const breadcrumbs = useBreadcrumbs()

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((crumb, index) => (
                    <Fragment key={crumb.label}>
                      {index > 0 ? (
                        <BreadcrumbSeparator className="hidden md:block" />
                      ) : null}
                      <BreadcrumbItem className={index === 0 ? "hidden md:block" : undefined}>
                        {crumb.href && index < breadcrumbs.length - 1 ? (
                          <BreadcrumbLink asChild>
                            <Link to={crumb.href}>{crumb.label}</Link>
                          </BreadcrumbLink>
                        ) : (
                          <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                    </Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-2 px-4">
              <GlobalSearch />
              <KeyboardShortcutsDialog />
              <ThemeToggle />
            </div>
          </header>
          <div className="flex flex-1 flex-col">
            <RouteErrorBoundary>
              <Outlet />
            </RouteErrorBoundary>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
