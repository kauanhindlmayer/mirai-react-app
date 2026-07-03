import { Link } from "react-router"
import { SearchXIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function NotFoundPage() {
  return (
    <section className="flex min-h-[75vh] flex-1 flex-col items-center justify-center gap-4 text-center">
      <SearchXIcon className="size-16 text-muted-foreground" />
      <h1 className="text-2xl font-semibold">Error</h1>
      <p className="text-muted-foreground">Something gone wrong!</p>
      <Button asChild>
        <Link to="/">Go to Home</Link>
      </Button>
    </section>
  )
}
