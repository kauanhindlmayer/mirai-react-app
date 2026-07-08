import { useSearchParams } from "react-router"

import { ErrorState } from "@/components/common/error-state"
import { ProjectGitHubTab } from "@/components/projects/project-github-tab"
import { ProjectMembersTab } from "@/components/projects/project-members-tab"
import { ProjectOverviewTab } from "@/components/projects/project-overview-tab"
import { ProjectTeamsTab } from "@/components/projects/project-teams-tab"
import { useCurrentProject } from "@/hooks/use-current-project"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ProjectSettingsPage() {
  const { projectId, project, isLoading, isError, error, refetch } =
    useCurrentProject()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get("tab") ?? "overview"

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold">
        {project?.name ?? "Project"} — Settings
      </h1>
      <Tabs value={activeTab} onValueChange={(tab) => setSearchParams({ tab })}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="github">GitHub</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          {isError ? (
            <ErrorState
              error={error}
              title="Failed to load project"
              onRetry={() => refetch()}
            />
          ) : isLoading ? (
            <Skeleton className="h-40" />
          ) : project ? (
            <ProjectOverviewTab project={project} />
          ) : null}
        </TabsContent>
        <TabsContent value="teams">
          {projectId && project ? (
            <ProjectTeamsTab
              organizationId={project.organizationId}
              projectId={projectId}
            />
          ) : null}
        </TabsContent>
        <TabsContent value="members">
          {projectId && project ? (
            <ProjectMembersTab
              organizationId={project.organizationId}
              projectId={projectId}
            />
          ) : null}
        </TabsContent>
        <TabsContent value="github">
          {projectId && project ? (
            <ProjectGitHubTab
              organizationId={project.organizationId}
              projectId={projectId}
              connection={project.gitHubRepositoryConnection}
            />
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}
