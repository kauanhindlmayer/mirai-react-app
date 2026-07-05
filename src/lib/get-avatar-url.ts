export function getAvatarUrl(imageUrl?: string | null): string | undefined {
  if (!imageUrl) {
    return undefined
  }

  return `${import.meta.env.VITE_API_URL}${imageUrl}`
}
