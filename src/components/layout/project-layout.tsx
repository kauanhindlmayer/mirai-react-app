import { Outlet } from "react-router"

import { WorkItemDetailDialog } from "@/components/work-items/work-item-detail-dialog"

export default function ProjectLayout() {
  return (
    <>
      <Outlet />
      <WorkItemDetailDialog />
    </>
  )
}
