export type ChatChannel = "FACEBOOK" | "WHATSAPP" | "WEB_WIDGET";

export type MessageDirection = "INBOUND" | "OUTBOUND" | "SYSTEM";

export interface Conversation {
    id: string;
    channel: ChatChannel;
    channel_identity: string;
    metadata: Record<string, unknown>;
    page_id: string | null;
    display_name: string;
    has_unread: boolean;
    unread_count: number;
    last_read_at: string | null;
    last_message_text: string | null;
    last_message_direction: MessageDirection | null;
    last_message_at: number | null;
    /** A human agent currently owns the conversation (bot silenced). */
    human_active: boolean;
    /** The bot will auto-respond (global BOT mode AND no human takeover). */
    bot_active: boolean;
    updated_at: string;
}

/** Machine keys carried on SYSTEM messages (attachment_payload.event). */
export type SystemEvent =
    | "human_takeover"
    | "bot_resumed"
    | "bot_paused_credits";

export interface ChatMessage {
    id: string;
    conversation_id: string;
    channel: ChatChannel;
    channel_identity: string;
    direction: MessageDirection;
    text: string | null;
    attachment_payload: { event?: SystemEvent } | Record<string, unknown> | null;
    timestamp: number;
    created_at: string | null;
}

/** Server → client WebSocket envelope. */
export type ChatSocketEvent =
    | { type: "chat_message"; payload: ChatMessage }
    | { type: "conversation_update"; payload: Conversation }
    | { type: "pong" };

export type ConnectionStatus = "connecting" | "open" | "closed";
