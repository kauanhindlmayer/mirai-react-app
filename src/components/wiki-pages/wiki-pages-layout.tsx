import { Outlet } from "react-router"

import { WikiPageTree } from "@/components/wiki-pages/wiki-page-tree"

export default function WikiPagesLayout() {
  return (
    <div className="flex flex-1 overflow-hidden">
      <WikiPageTree />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Outlet />
      </div>
    </div>
  )
}
