import { useQuery } from "@tanstack/react-query"

import { listOrganizations } from "@/api/organizations"

/**
 * Query key/staleTime/placeholderData convention for this codebase (mirrors
 * the Pinia Colada patterns in mirai-app, see FEATURES.md §5):
 * - key: [entityName, ...idsOrParams], reactive on route params/filters
 * - staleTime: 60_000 for frequently-changing lists, 300_000 for rarely-changing data
 * - enabled: gate on parent IDs being present (e.g. `enabled: !!projectId`)
 * - placeholderData: an empty collection/object instead of leaving `data` undefined
 */
export function useOrganizations() {
  return useQuery({
    queryKey: ["organizations"],
    queryFn: listOrganizations,
    staleTime: 60_000,
    placeholderData: [],
  })
}
