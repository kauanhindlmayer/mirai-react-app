/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from "react"

type WorkItemContextValue = {
  projectId: string
  workItemId: string
}

const WorkItemContext = createContext<WorkItemContextValue | undefined>(
  undefined
)

type WorkItemProviderProps = WorkItemContextValue & {
  children: ReactNode
}

export function WorkItemProvider({
  projectId,
  workItemId,
  children,
}: WorkItemProviderProps) {
  return (
    <WorkItemContext.Provider value={{ projectId, workItemId }}>
      {children}
    </WorkItemContext.Provider>
  )
}

export function useWorkItemContext() {
  const context = useContext(WorkItemContext)

  if (context === undefined) {
    throw new Error("useWorkItemContext must be used within a WorkItemProvider")
  }

  return context
}
