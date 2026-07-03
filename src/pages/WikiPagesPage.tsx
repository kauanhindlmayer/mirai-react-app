import { Link, useParams } from "react-router"
import { FileTextIcon, PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function WikiPagesPage() {
  const { projectId } = useParams<{ projectId: string }>()

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <FileTextIcon className="size-10 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        Select a page from the sidebar, or create a new one.
      </p>
      <Button asChild>
        <Link to={`/projects/${projectId}/wiki-pages/new`}>
          <PlusIcon />
          New Wiki Page
        </Link>
      </Button>
    </div>
  )
}
