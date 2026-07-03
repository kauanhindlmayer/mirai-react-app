import { Link } from "react-router"
import { FrownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function OopsPage() {
  return (
    <section className="flex min-h-[75vh] flex-1 flex-col items-center justify-center gap-4 text-center">
      <FrownIcon className="size-16 text-muted-foreground" />
      <h1 className="text-2xl font-semibold">Oops!</h1>
      <p className="text-muted-foreground">There is nothing here</p>
      <Button asChild>
        <Link to="/">Go to Home</Link>
      </Button>
    </section>
  )
}
