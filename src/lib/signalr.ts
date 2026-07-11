import {
  HttpTransportType,
  type HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from "@microsoft/signalr"

import { getAccessToken } from "@/lib/auth-storage"

/**
 * Builds a configured (but not yet started) hub connection.
 * Hub URL pattern: `${VITE_API_URL}/hubs/{feature}`.
 *
 * `accessTokenFactory` is required because this app authenticates via a
 * bearer token in localStorage, not cookies — the WebSocket transport can't
 * set an Authorization header on its handshake, so the SignalR client sends
 * this as an `access_token` query param instead.
 */
export function createHubConnection(hub: string): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(`${import.meta.env.VITE_API_URL}${hub}`, {
      accessTokenFactory: () => getAccessToken() ?? "",
      withCredentials: true,
      transport: HttpTransportType.WebSockets,
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Information)
    .build()
}
