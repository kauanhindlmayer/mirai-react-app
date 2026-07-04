import { useParams } from "react-router"

import { useOrganizationsQuery } from "@/queries/organizations"

export function useCurrentOrganization() {
  const { organizationId } = useParams<{ organizationId: string }>()

  const { data: organizations = [], isLoading } = useOrganizationsQuery()

  const organization = organizations.find((org) => org.id === organizationId)

  return {
    organizationId,
    organization,
    organizations,
    isLoading,
  }
}
