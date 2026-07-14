import { Link } from "react-router"

import { useCurrentProject } from "@/hooks/use-current-project"
import { useUserProfileQuery } from "@/queries/users"
import { getAvatarUrl } from "@/lib/get-avatar-url"
import { getInitials } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

type MentionHoverCardContentProps = {
  userId: string
  fallbackName: string
}

export function MentionHoverCardContent({
  userId,
  fallbackName,
}: MentionHoverCardContentProps) {
  const { project } = useCurrentProject()
  const organizationId = project?.organizationId
  const {
    data: profile,
    isLoading,
    isError,
  } = useUserProfileQuery(organizationId, userId)
  const fullName = profile?.fullName ?? fallbackName
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Avatar size="lg">
          <AvatarImage src={getAvatarUrl(profile?.avatarUrl)} alt={fullName} />
          <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium">{fullName}</span>
          {isLoading ? (
            <Skeleton className="mt-1 h-3 w-32" />
          ) : (
            <span className="truncate text-xs text-muted-foreground">
              {isError ? "Couldn't load profile" : profile?.email}
            </span>
          )}
        </div>
      </div>
      {organizationId ? (
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link to={`/organizations/${organizationId}/users/${userId}`}>
            Show profile
          </Link>
        </Button>
      ) : null}
    </div>
  )
}
