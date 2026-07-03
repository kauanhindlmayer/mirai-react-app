import { useEffect, useRef } from "react"
import type { HubConnection } from "@microsoft/signalr"
import { useQueryClient, type QueryKey } from "@tanstack/react-query"

import { createHubConnection } from "@/lib/signalr"

type EventInvalidation = {
  event: string
  queryKey: QueryKey
}

/**
 * Connects to a SignalR hub for the lifetime of the component, subscribes to
 * the given events, and invalidates the paired query key on receipt (letting
 * the normal fetch-on-invalidate flow refresh the UI, rather than merging
 * pushed data manually).
 */
export function useSignalR(hub: string, events: EventInvalidation[]) {
  const queryClient = useQueryClient()
  const connectionRef = useRef<HubConnection | null>(null)
  const eventsRef = useRef(events)

  useEffect(() => {
    eventsRef.current = events
  })

  useEffect(() => {
    const connection = createHubConnection(hub)
    connectionRef.current = connection

    const eventNames = new Set(eventsRef.current.map((e) => e.event))
    for (const eventName of eventNames) {
      connection.on(eventName, () => {
        for (const { event, queryKey } of eventsRef.current) {
          if (event === eventName) {
            queryClient.invalidateQueries({ queryKey })
          }
        }
      })
    }

    connection.start().catch((error: unknown) => {
      console.error("Error connecting to SignalR hub:", error)
    })

    return () => {
      void connection.stop()
      connectionRef.current = null
    }
  }, [hub, queryClient])

  function invoke(method: string, ...args: unknown[]) {
    return connectionRef.current?.invoke(method, ...args)
  }

  return { invoke }
}
