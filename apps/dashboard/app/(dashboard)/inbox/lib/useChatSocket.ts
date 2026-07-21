"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getChatWsToken } from "@/lib/api";
import type { ChatSocketEvent, ConnectionStatus } from "./types";

const PING_INTERVAL_MS = 25_000;
const MAX_BACKOFF_MS = 30_000;

/**
 * Maintains a single authenticated WebSocket to the agent inbox stream.
 *
 * - Fetches a fresh JWT via the getChatWsToken server action on every (re)connect
 *   so token refresh is picked up without a page reload.
 * - Reconnects with exponential backoff + jitter; a heartbeat ping keeps the
 *   connection alive through idle proxies.
 * - Never throws into React render; connection state is exposed via `status`.
 */
export function useChatSocket({
    wsBaseUrl,
    shopId,
    onEvent,
}: {
    wsBaseUrl: string;
    shopId: string;
    onEvent: (event: ChatSocketEvent) => void;
}) {
    const [status, setStatus] = useState<ConnectionStatus>("connecting");

    // Keep the latest callback without re-triggering the connect effect.
    const onEventRef = useRef(onEvent);
    onEventRef.current = onEvent;

    const socketRef = useRef<WebSocket | null>(null);
    const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const attemptRef = useRef(0);
    const closedByUsRef = useRef(false);

    const connect = useCallback(async () => {
        if (closedByUsRef.current) return;

        setStatus("connecting");
        const token = await getChatWsToken();
        if (!token || closedByUsRef.current) {
            if (!closedByUsRef.current) scheduleReconnect();
            return;
        }

        const url = `${wsBaseUrl}/ws/chat/?token=${encodeURIComponent(token)}&tenant=${encodeURIComponent(shopId)}`;
        let ws: WebSocket;
        try {
            ws = new WebSocket(url);
        } catch {
            scheduleReconnect();
            return;
        }
        socketRef.current = ws;

        ws.onopen = () => {
            attemptRef.current = 0;
            setStatus("open");
            pingRef.current = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ action: "ping" }));
                }
            }, PING_INTERVAL_MS);
        };

        ws.onmessage = (ev) => {
            try {
                const data = JSON.parse(ev.data) as ChatSocketEvent;
                onEventRef.current(data);
            } catch {
                // Ignore malformed frames rather than tearing down the socket.
            }
        };

        ws.onclose = () => {
            clearPing();
            setStatus("closed");
            if (!closedByUsRef.current) scheduleReconnect();
        };

        ws.onerror = () => {
            // onclose fires after onerror; reconnect is handled there.
            ws.close();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wsBaseUrl, shopId]);

    const scheduleReconnect = useCallback(() => {
        if (reconnectRef.current) clearTimeout(reconnectRef.current);
        const attempt = attemptRef.current++;
        const base = Math.min(1000 * 2 ** attempt, MAX_BACKOFF_MS);
        const delay = base / 2 + Math.random() * (base / 2); // full jitter over [base/2, base]
        reconnectRef.current = setTimeout(() => void connect(), delay);
    }, [connect]);

    const clearPing = () => {
        if (pingRef.current) {
            clearInterval(pingRef.current);
            pingRef.current = null;
        }
    };

    /** Send a JSON action to the server (e.g. mark_read). No-op if not open. */
    const send = useCallback((data: Record<string, unknown>) => {
        const ws = socketRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    }, []);

    useEffect(() => {
        closedByUsRef.current = false;
        void connect();

        // Reconnect promptly when the tab regains focus after a laptop sleep etc.
        const onVisible = () => {
            if (
                document.visibilityState === "visible" &&
                socketRef.current?.readyState !== WebSocket.OPEN
            ) {
                attemptRef.current = 0;
                void connect();
            }
        };
        document.addEventListener("visibilitychange", onVisible);

        return () => {
            closedByUsRef.current = true;
            document.removeEventListener("visibilitychange", onVisible);
            if (reconnectRef.current) clearTimeout(reconnectRef.current);
            clearPing();
            socketRef.current?.close();
            socketRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connect]);

    return { status, send };
}
