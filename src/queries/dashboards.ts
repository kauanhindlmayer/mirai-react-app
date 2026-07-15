import { useQuery } from "@tanstack/react-query"

import { getDashboardData } from "@/api/dashboards"

export function dashboardQueryKey(teamId: string | undefined) {
  return ["dashboard", teamId]
}

export function useDashboardDataQuery(teamId: string | undefined) {
  return useQuery({
    queryKey: dashboardQueryKey(teamId),
    queryFn: () => getDashboardData(teamId!),
    enabled: !!teamId,
    staleTime: 60_000,
  })
}
