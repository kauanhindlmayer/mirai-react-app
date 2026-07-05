import { useEffect } from "react"
import { useNavigate } from "react-router"

import { useOrganizationsQuery } from "@/queries/organizations"

export default function HomeRedirectPage() {
  const navigate = useNavigate()
  const { data: organizations, isSuccess, isFetching } = useOrganizationsQuery()

  useEffect(() => {
    if (!isSuccess || isFetching) return

    const firstOrganization = organizations?.[0]
    navigate(
      firstOrganization
        ? `/organizations/${firstOrganization.id}/projects`
        : "/organizations",
      { replace: true }
    )
  }, [isSuccess, isFetching, organizations, navigate])

  return null
}
