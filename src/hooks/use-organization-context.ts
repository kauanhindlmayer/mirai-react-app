import { useQuery } from "@tanstack/react-query"
import { useParams } from "react-router"

import { listOrganizations } from "@/api/organizations"

export function useOrganizationContext() {
  const { organizationId } = useParams<{ organizationId: string }>()

  const organizationsQuery = useQuery({
    queryKey: ["organizations"],
    queryFn: listOrganizations,
    staleTime: 60_000,
    placeholderData: [],
  })

  const organizations = organizationsQuery.data ?? []
  const organization = organizations.find((org) => org.id === organizationId)

  return {
    organizationId,
    organization,
    organizations,
    isLoading: organizationsQuery.isLoading,
  }
}
