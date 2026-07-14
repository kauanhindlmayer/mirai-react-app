import { useParams } from "react-router"
import { FolderIcon, UsersIcon } from "lucide-react"

import { useUserProfileQuery } from "@/queries/users"
import { getAvatarUrl } from "@/lib/get-avatar-url"
import { getInitials } from "@/lib/utils"
import type { ProfileProject, ProfileTeam } from "@/types/users"
import { ErrorState } from "@/components/common/error-state"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function UserProfilePage() {
  const { organizationId, userId } = useParams<{
    organizationId: string
    userId: string
  }>()
  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
  } = useUserProfileQuery(organizationId, userId)
  if (isError) {
    return (
      <ErrorState
        error={error}
        title="Failed to load profile"
        onRetry={() => refetch()}
      />
    )
  }
  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }
  if (!profile) return null
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4">
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          <AvatarImage
            src={getAvatarUrl(profile.avatarUrl)}
            alt={profile.fullName}
          />
          <AvatarFallback className="text-lg">
            {getInitials(profile.fullName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <h1 className="truncate text-2xl font-semibold">
            {profile.fullName}
          </h1>
          <span className="truncate text-sm text-muted-foreground">
            {profile.email}
          </span>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderIcon className="size-4 text-muted-foreground" />
            Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profile.projects.length > 0 ? (
            <ul className="flex flex-col divide-y">
              {profile.projects.map((project) => (
                <ProjectRow key={project.id} project={project} />
              ))}
            </ul>
          ) : (
            <p className="py-2 text-sm text-muted-foreground">
              Not a member of any project in this organization.
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="size-4 text-muted-foreground" />
            Teams
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profile.teams.length > 0 ? (
            <ul className="flex flex-col divide-y">
              {profile.teams.map((team) => (
                <TeamRow key={team.id} team={team} />
              ))}
            </ul>
          ) : (
            <p className="py-2 text-sm text-muted-foreground">
              Not a member of any team in this organization.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ProjectRow({ project }: { project: ProfileProject }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="truncate font-medium">{project.name}</span>
      <Badge variant="secondary">{project.roleName}</Badge>
    </li>
  )
}

function TeamRow({ team }: { team: ProfileTeam }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2 text-sm">
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{team.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {team.projectName}
        </span>
      </div>
      <Badge variant="secondary">{team.roleName}</Badge>
    </li>
  )
}
