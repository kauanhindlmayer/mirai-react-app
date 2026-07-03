import { post } from "@/lib/api-client"
import type { WisdomResponse } from "@/types/wisdom-extractor"

export function extractWisdom(
  projectId: string,
  question: string
): Promise<WisdomResponse> {
  return post(`/projects/${projectId}/wisdom-extractor`, { question })
}
