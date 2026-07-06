import { MonitorIcon, MoonIcon, PaintbrushIcon, SunIcon } from "lucide-react"

import {
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/components/layout/theme-provider"

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: <SunIcon /> },
  { value: "dark", label: "Dark", icon: <MoonIcon /> },
  { value: "system", label: "System", icon: <MonitorIcon /> },
] as const

export function AppearanceMenu() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <PaintbrushIcon />
        Appearance
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {THEME_OPTIONS.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={theme === option.value}
            onCheckedChange={() => setTheme(option.value)}
          >
            {option.icon}
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
