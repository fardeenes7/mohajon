import "server-only";

/**
 * Resolve the browser-reachable WebSocket origin for the chat stream.
 *
 * `API_BASE_URL` is server-only and, under Docker Compose, points at an internal
 * service host (e.g. http://api:8000) that the browser cannot reach. So a public
 * override (`NEXT_PUBLIC_WS_URL`) wins when set; otherwise we derive ws(s):// from
 * the API base, which is correct for local dev (http://localhost:8000).
 */
export function resolveWsBaseUrl(): string {
    const override = process.env.NEXT_PUBLIC_WS_URL;
    if (override) return override.replace(/\/$/, "");

    const api = process.env.API_BASE_URL || "http://localhost:8000";
    return api.replace(/^http/, "ws").replace(/\/$/, "");
}
