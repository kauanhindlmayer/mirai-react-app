import { get } from "@/lib/api-client"
import type { DashboardResponse } from "@/types/dashboards"

export function getDashboardData(teamId: string): Promise<DashboardResponse> {
  return get(`/teams/${teamId}/dashboards`)
}
