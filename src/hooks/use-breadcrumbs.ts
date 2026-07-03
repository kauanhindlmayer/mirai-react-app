import { useLocation } from "react-router"

import { useCurrentOrganization } from "@/hooks/use-current-organization"
import { useCurrentProject } from "@/hooks/use-current-project"

const PAGE_LABELS: Record<string, string> = {
  projects: "Projects",
  settings: "Settings",
  summary: "Summary",
  dashboards: "Dashboards",
  "wiki-pages": "Wiki Pages",
  new: "New",
  edit: "Edit",
  "work-items": "Work Items",
  boards: "Boards",
  backlogs: "Backlogs",
  sprints: "Sprints",
  personas: "Personas",
  retrospectives: "Retrospectives",
  tags: "Tags",
  import: "Import",
  "wisdom-extractor": "Wisdom Extractor",
}

function labelFor(segment: string): string {
  return (
    PAGE_LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1)
  )
}

export type Breadcrumb = {
  label: string
  href?: string
}

export function useBreadcrumbs(): Breadcrumb[] {
  const location = useLocation()
  const { organizationId, organization } = useCurrentOrganization()
  const { projectId, project } = useCurrentProject()

  const segments = location.pathname.split("/").filter(Boolean)
  const lastSegment = segments[segments.length - 1]

  if (projectId) {
    return [
      {
        label: project?.name ?? "Project",
        href: `/projects/${projectId}/summary`,
      },
      { label: labelFor(lastSegment) },
    ]
  }

  if (organizationId) {
    return [
      { label: "Organizations", href: "/organizations" },
      {
        label: organization?.name ?? "Organization",
        href: `/organizations/${organizationId}/projects`,
      },
      { label: labelFor(lastSegment) },
    ]
  }

  return [{ label: "Organizations" }]
}
