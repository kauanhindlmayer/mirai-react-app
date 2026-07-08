import { useMutation } from "@tanstack/react-query"

import { extractWisdom } from "@/api/wisdom-extractor"
import { createErrorToastHandler } from "@/lib/query-helpers"

export function useExtractWisdomMutation(projectId: string) {
  return useMutation({
    mutationFn: (question: string) => extractWisdom(projectId, question),
    onError: createErrorToastHandler("Failed to extract wisdom."),
  })
}
