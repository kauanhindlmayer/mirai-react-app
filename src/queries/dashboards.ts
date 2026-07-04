import { useQuery } from "@tanstack/react-query"

import { getDashboardData } from "@/api/dashboards"

export function useDashboardDataQuery(teamId: string | undefined) {
  return useQuery({
    queryKey: ["dashboard", teamId],
    queryFn: () => getDashboardData(teamId!),
    enabled: !!teamId,
    staleTime: 60_000,
  })
}
