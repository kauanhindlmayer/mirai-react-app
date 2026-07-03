import {
  HttpTransportType,
  type HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from "@microsoft/signalr"

/**
 * Builds a configured (but not yet started) hub connection.
 * Hub URL pattern: `${VITE_API_URL}/hubs/{feature}`.
 */
export function createHubConnection(hub: string): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(`${import.meta.env.VITE_API_URL}${hub}`, {
      withCredentials: true,
      transport: HttpTransportType.WebSockets,
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Information)
    .build()
}
