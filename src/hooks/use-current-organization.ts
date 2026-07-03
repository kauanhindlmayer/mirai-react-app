import { useQuery } from "@tanstack/react-query"
import { useParams } from "react-router"

import { listOrganizations } from "@/api/organizations"

export function useCurrentOrganization() {
  const { organizationId } = useParams<{ organizationId: string }>()

  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ["organizations"],
    queryFn: listOrganizations,
    staleTime: 60_000,
    placeholderData: [],
  })

  const organization = organizations.find((org) => org.id === organizationId)

  return {
    organizationId,
    organization,
    organizations,
    isLoading,
  }
}
