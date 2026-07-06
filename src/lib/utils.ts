import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong."
}

export function getInitials(name?: string): string {
  if (!name) return ""

  const parts = name.trim().split(/\s+/)
  if (parts.length < 2) {
    return parts[0][0].toUpperCase()
  }

  const firstNameInitial = parts[0][0]
  const lastNameInitial = parts[parts.length - 1][0]
  return (firstNameInitial + lastNameInitial).toUpperCase()
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  if (target.isContentEditable) {
    return true
  }

  const editableParent = target.closest(
    "input, textarea, select, [contenteditable='true']"
  )
  if (editableParent) {
    return true
  }

  return false
}
