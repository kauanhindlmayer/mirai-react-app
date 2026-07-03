import { Link } from "react-router"
import { Building2Icon } from "lucide-react"

import { useOrganizations } from "@/queries/organizations"
import { useDelayedLoading } from "@/hooks/use-delayed-loading"
import { CreateOrganizationSheet } from "@/components/create-organization-sheet"
import { Skeleton } from "@/components/ui/skeleton"

export default function OrganizationsPage() {
  const { data: organizations, isLoading } = useOrganizations()
  const showLoading = useDelayedLoading(isLoading)

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Organizations</h1>
        <CreateOrganizationSheet />
      </div>
      {showLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : organizations && organizations.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-3">
          {organizations.map((org) => (
            <Link
              key={org.id}
              to={`/organizations/${org.id}/projects`}
              className="flex flex-col gap-2 rounded-xl border p-4 hover:bg-accent"
            >
              <Building2Icon className="size-5 text-muted-foreground" />
              <span className="font-medium">{org.name}</span>
              <span className="text-sm text-muted-foreground">
                {org.description}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          You don&apos;t belong to any organizations yet.
        </p>
      )}
    </div>
  )
}
