import { useEffect } from "react"
import { useNavigate } from "react-router"

import { useOrganizationsQuery } from "@/queries/organizations"

export default function HomeRedirectPage() {
  const navigate = useNavigate()
  const { data: organizations, isSuccess } = useOrganizationsQuery()

  useEffect(() => {
    if (!isSuccess) return

    const firstOrganization = organizations?.[0]
    navigate(
      firstOrganization
        ? `/organizations/${firstOrganization.id}/projects`
        : "/organizations",
      { replace: true }
    )
  }, [isSuccess, organizations, navigate])

  return null
}
