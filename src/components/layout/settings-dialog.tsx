import { useState } from "react"

import { AccountSettingsSection } from "@/components/layout/account-settings-section"
import { NotificationPreferencesSection } from "@/components/notifications/notification-preferences-section"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type SettingsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type SectionId = "account" | "notifications"

type SectionDefinition = {
  id: SectionId
  label: string
  title: string
  description: string
}

const SECTIONS: SectionDefinition[] = [
  {
    id: "account",
    label: "Account",
    title: "Account",
    description: "Update your name and profile picture.",
  },
  {
    id: "notifications",
    label: "Notifications",
    title: "Notifications",
    description: "Choose which notifications you want to receive.",
  },
]

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [activeSection, setActiveSection] = useState<SectionId>("account")

  const active = SECTIONS.find((section) => section.id === activeSection)!

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription className="sr-only">
            Update your account and notification settings.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
          <nav
            role="tablist"
            aria-label="Settings sections"
            className="flex gap-1 border-b pb-3 sm:w-40 sm:shrink-0 sm:flex-col sm:border-r sm:border-b-0 sm:pr-3 sm:pb-0"
          >
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                role="tab"
                aria-selected={section.id === activeSection}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "flex-1 rounded-md px-2.5 py-1.5 text-left font-medium transition-colors sm:flex-initial",
                  section.id === activeSection
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                {section.label}
              </button>
            ))}
          </nav>

          <div
            role="tabpanel"
            className="flex min-w-0 flex-1 flex-col gap-4 sm:min-h-[340px]"
          >
            <div className="flex flex-col gap-0.5">
              <h2 className="font-medium">{active.title}</h2>
              <p className="text-muted-foreground">{active.description}</p>
            </div>

            {activeSection === "account" ? (
              <AccountSettingsSection onSaved={() => onOpenChange(false)} />
            ) : (
              <NotificationPreferencesSection />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
