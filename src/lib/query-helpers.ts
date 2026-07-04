import { toast } from "sonner"

export function createErrorToastHandler(message: string) {
  return (error: unknown) => {
    toast.error(message, {
      description:
        error instanceof Error ? error.message : "Something went wrong.",
    })
  }
}
