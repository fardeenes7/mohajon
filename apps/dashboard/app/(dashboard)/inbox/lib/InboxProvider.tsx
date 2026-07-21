"use client";

import {
    createContext,
    useContext,
    useCallback,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { useChatSocket } from "./useChatSocket";
import type {
    ChatChannel,
    ChatMessage,
    Conversation,
    ConnectionStatus,
    ChatSocketEvent,
} from "./types";

interface InboxContextValue {
    shopId: string;
    conversations: Conversation[];
    status: ConnectionStatus;
    /** Newest live message per conversation id, so an open thread can append it. */
    liveMessages: Record<string, ChatMessage[]>;
    getConversation: (id: string) => Conversation | undefined;
    markReadLocal: (conversation: Conversation) => void;
    sendMarkRead: (channel: ChatChannel, psid: string) => void;
    /** Register a locally-sent/optimistic message so other views stay in sync. */
    pushLocalMessage: (message: ChatMessage) => void;
    consumeLiveMessages: (conversationId: string) => ChatMessage[];
}

const InboxContext = createContext<InboxContextValue | null>(null);

export function useInbox(): InboxContextValue {
    const ctx = useContext(InboxContext);
    if (!ctx) throw new Error("useInbox must be used within <InboxProvider>");
    return ctx;
}

function upsertConversation(
    list: Conversation[],
    incoming: Partial<Conversation> & { id: string },
): Conversation[] {
    const idx = list.findIndex((c) => c.id === incoming.id);
    if (idx === -1) {
        // A brand-new conversation arriving live — only add if we have enough to render.
        if (!incoming.channel || !incoming.channel_identity) return list;
        return [incoming as Conversation, ...list];
    }
    const merged = { ...list[idx], ...incoming } as Conversation;
    const next = [...list];
    next.splice(idx, 1);
    // Re-sort to the top: newest activity first.
    return [merged, ...next];
}

export function InboxProvider({
    shopId,
    wsBaseUrl,
    initialConversations,
    children,
}: {
    shopId: string;
    wsBaseUrl: string;
    initialConversations: Conversation[];
    children: ReactNode;
}) {
    const [conversations, setConversations] =
        useState<Conversation[]>(initialConversations);
    const [liveMessages, setLiveMessages] = useState<
        Record<string, ChatMessage[]>
    >({});

    const handleEvent = useCallback((event: ChatSocketEvent) => {
        if (event.type === "chat_message") {
            const msg = event.payload;
            // SYSTEM markers belong in the open thread's timeline, but must not
            // become a conversation's "last message" preview or bump it to the top.
            if (msg.direction === "SYSTEM") {
                setLiveMessages((prev) => ({
                    ...prev,
                    [msg.conversation_id]: [...(prev[msg.conversation_id] ?? []), msg],
                }));
                return;
            }
            setLiveMessages((prev) => ({
                ...prev,
                [msg.conversation_id]: [...(prev[msg.conversation_id] ?? []), msg],
            }));
            setConversations((prev) => {
                const existing = prev.find((c) => c.id === msg.conversation_id);
                const isInbound = msg.direction === "INBOUND";
                return upsertConversation(prev, {
                    id: msg.conversation_id,
                    channel: msg.channel,
                    channel_identity: msg.channel_identity,
                    last_message_text: msg.text,
                    last_message_direction: msg.direction,
                    last_message_at: msg.timestamp,
                    updated_at: msg.created_at ?? new Date().toISOString(),
                    // Bump unread only for inbound; preserve prior count.
                    has_unread: isInbound ? true : existing?.has_unread ?? false,
                    unread_count: isInbound
                        ? (existing?.unread_count ?? 0) + 1
                        : existing?.unread_count ?? 0,
                });
            });
        } else if (event.type === "conversation_update") {
            const conv = event.payload;
            setConversations((prev) => upsertConversation(prev, conv));
        }
    }, []);

    const { status, send } = useChatSocket({ wsBaseUrl, shopId, onEvent: handleEvent });

    const getConversation = useCallback(
        (id: string) => conversations.find((c) => c.id === id),
        [conversations],
    );

    const markReadLocal = useCallback((conversation: Conversation) => {
        setConversations((prev) =>
            prev.map((c) =>
                c.id === conversation.id
                    ? { ...c, has_unread: false, unread_count: 0 }
                    : c,
            ),
        );
    }, []);

    const sendMarkRead = useCallback(
        (channel: ChatChannel, psid: string) => {
            send({ action: "mark_read", channel, psid });
        },
        [send],
    );

    const pushLocalMessage = useCallback((message: ChatMessage) => {
        // Only reflect the send in the sidebar preview. The thread owns the
        // optimistic draft in its own local state; adding it to liveMessages too
        // would render it twice (once as "live", once as the pending draft) until
        // the server echo arrives. The real message lands via the WS echo.
        setConversations((prev) =>
            upsertConversation(prev, {
                id: message.conversation_id,
                channel: message.channel,
                channel_identity: message.channel_identity,
                last_message_text: message.text,
                last_message_direction: message.direction,
                last_message_at: message.timestamp,
                updated_at: message.created_at ?? new Date().toISOString(),
            }),
        );
    }, []);

    const consumeLiveMessages = useCallback(
        (conversationId: string) => liveMessages[conversationId] ?? [],
        [liveMessages],
    );

    const value = useMemo<InboxContextValue>(
        () => ({
            shopId,
            conversations,
            status,
            liveMessages,
            getConversation,
            markReadLocal,
            sendMarkRead,
            pushLocalMessage,
            consumeLiveMessages,
        }),
        [
            shopId,
            conversations,
            status,
            liveMessages,
            getConversation,
            markReadLocal,
            sendMarkRead,
            pushLocalMessage,
            consumeLiveMessages,
        ],
    );

    return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>;
}
