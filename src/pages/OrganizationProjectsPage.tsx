import { Link } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { FolderIcon, PencilIcon } from "lucide-react"

import { listProjects } from "@/api/projects"
import { useOrganizationContext } from "@/hooks/use-organization-context"
import { useDelayedLoading } from "@/hooks/use-delayed-loading"
import { ProjectFormSheet } from "@/components/project-form-sheet"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export default function OrganizationProjectsPage() {
  const { organizationId, organization } = useOrganizationContext()

  const projectsQuery = useQuery({
    queryKey: ["projects", organizationId],
    queryFn: () => listProjects(organizationId!),
    enabled: !!organizationId,
    staleTime: 60_000,
    placeholderData: [],
  })
  const showLoading = useDelayedLoading(projectsQuery.isLoading)
  const projects = projectsQuery.data ?? []

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {organization?.name ?? "Organization"} — Projects
        </h1>
        {organizationId ? (
          <ProjectFormSheet
            organizationId={organizationId}
            trigger={<Button>New Project</Button>}
          />
        ) : null}
      </div>
      {showLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : projects.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="relative flex flex-col gap-2 rounded-xl border p-4 hover:bg-accent"
            >
              <Link
                to={`/projects/${project.id}/summary`}
                className="flex flex-col gap-2"
              >
                <FolderIcon className="size-5 text-muted-foreground" />
                <span className="font-medium">{project.name}</span>
                <span className="text-sm text-muted-foreground">
                  {project.description}
                </span>
              </Link>
              {organizationId ? (
                <ProjectFormSheet
                  organizationId={organizationId}
                  project={project}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 size-7"
                      aria-label={`Edit ${project.name}`}
                    >
                      <PencilIcon className="size-3.5" />
                    </Button>
                  }
                />
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No projects in this organization yet.
        </p>
      )}
    </div>
  )
}
