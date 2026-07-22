"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
    MessageScrollerProvider,
    MessageScroller,
    MessageScrollerViewport,
    MessageScrollerContent,
    MessageScrollerItem,
    MessageScrollerButton,
} from "@repo/ui/components/ui/message-scroller";
import { Message, MessageContent, MessageFooter } from "@repo/ui/components/ui/message";
import { Bubble, BubbleContent } from "@repo/ui/components/ui/bubble";
import { Marker, MarkerContent, MarkerIcon } from "@repo/ui/components/ui/marker";
import { Avatar, AvatarFallback } from "@repo/ui/components/ui/avatar";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import { Spinner } from "@repo/ui/components/ui/spinner";
import {
    IconUser,
    IconRobot,
    IconRobotFace,
    IconHeadset,
    IconAlertTriangle,
    IconInfoCircle,
    IconClockPause,
    IconPlugConnectedX,
    type Icon,
} from "@tabler/icons-react";
import { getInboxDetail, humanTakeover, agentSend } from "@/lib/api";
import { useInbox } from "../lib/InboxProvider";
import { ChannelIcon, channelMeta } from "../lib/channel";
import type { ChatMessage, Conversation, SystemEvent } from "../lib/types";
import { Composer } from "./Composer";

/** Icon per SYSTEM event key for the inline timeline marker. */
function systemEventIcon(event: SystemEvent | undefined): Icon {
    switch (event) {
        case "human_takeover":
            return IconHeadset;
        case "bot_resumed":
            return IconRobotFace;
        case "bot_paused_credits":
            return IconAlertTriangle;
        case "ai_rate_limited":
            return IconClockPause;
        case "ai_connection_error":
            return IconPlugConnectedX;
        case "ai_model_unavailable":
        case "ai_context_overflow":
        case "ai_tool_limit":
        case "ai_error":
            return IconAlertTriangle;
        default:
            return IconInfoCircle;
    }
}

function dayKey(ts: number): string {
    return new Date(ts).toDateString();
}

function dayLabel(ts: number): string {
    const d = new Date(ts);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86_400_000).toDateString();
    if (d.toDateString() === today) return "Today";
    if (d.toDateString() === yesterday) return "Yesterday";
    return d.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
}

function timeLabel(ts: number): string {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

type RenderMessage = ChatMessage & { renderKey: string };

const isOptimisticEcho = (real: ChatMessage, draft: ChatMessage) =>
    real.direction === "OUTBOUND" &&
    (real.text ?? "") === (draft.text ?? "") &&
    real.timestamp >= draft.timestamp - 2000;

/**
 * Merge fetched history + live events + optimistic drafts into one ordered list.
 *
 * Each item carries a STABLE `renderKey`. When a server echo confirms an
 * optimistic draft, the echo inherits the draft's key so React updates the same
 * node in place instead of unmounting the draft and inserting a new one — the
 * latter breaks MessageScroller, which holds a DOM reference to the scroll anchor
 * (crash: insertBefore "node is not a child of this node").
 */
function mergeMessages(
    fetched: ChatMessage[],
    live: ChatMessage[],
    optimistic: ChatMessage[],
): RenderMessage[] {
    const byId = new Map<string, ChatMessage>();
    for (const m of [...fetched, ...live]) byId.set(m.id, m);
    const real = Array.from(byId.values());

    // Map each confirmed real message back to the draft key it replaces.
    const claimedDraft = new Set<string>();
    const keyForReal = new Map<string, string>();
    for (const r of real) {
        const draft = optimistic.find(
            (o) => !claimedDraft.has(o.id) && isOptimisticEcho(r, o),
        );
        if (draft) {
            claimedDraft.add(draft.id);
            keyForReal.set(r.id, draft.id);
        }
    }

    const realRendered: RenderMessage[] = real.map((r) => ({
        ...r,
        renderKey: keyForReal.get(r.id) ?? r.id,
    }));
    // Drafts still awaiting their echo keep showing under their own key.
    const pending: RenderMessage[] = optimistic
        .filter((o) => !claimedDraft.has(o.id))
        .map((o) => ({ ...o, renderKey: o.id }));

    return [...realRendered, ...pending].sort((a, b) => a.timestamp - b.timestamp);
}

export function ConversationThread({ conversation }: { conversation: Conversation }) {
    const { shopId, consumeLiveMessages, markReadLocal, sendMarkRead, pushLocalMessage } =
        useInbox();

    const [fetched, setFetched] = useState<ChatMessage[]>([]);
    const [optimistic, setOptimistic] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [takingOver, setTakingOver] = useState(false);

    const channel = conversation.channel;
    const psid = conversation.channel_identity;
    const pageId = conversation.page_id ?? "";
    const meta = channelMeta(channel);
    // Bot state flows live via conversation_update, so this always reflects the
    // latest takeover/handback without a manual refetch.
    const humanActive = conversation.human_active;
    const botActive = conversation.bot_active;

    const live = consumeLiveMessages(conversation.id);

    // Load history whenever the selected conversation changes.
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setFetched([]);
        setOptimistic([]);
        getInboxDetail(shopId, psid, channel)
            .then((res) => {
                if (cancelled) return;
                if (res.success) setFetched(res.data as ChatMessage[]);
                else toast.error(res.error || "Failed to load messages");
            })
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
        // shopId is stable per provider; psid/channel identify the thread.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversation.id, psid, channel]);

    // Opening the thread (and any new inbound while open) clears unread state.
    const inboundCount = live.filter((m) => m.direction === "INBOUND").length;
    useEffect(() => {
        markReadLocal(conversation);
        sendMarkRead(channel, psid);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversation.id, inboundCount]);

    const messages = useMemo(
        () => mergeMessages(fetched, live, optimistic),
        [fetched, live, optimistic],
    );

    const handleSend = useCallback(
        async (text: string): Promise<boolean> => {
            const now = Date.now();
            const draft: ChatMessage = {
                id: `optimistic-${now}`,
                conversation_id: conversation.id,
                channel,
                channel_identity: psid,
                direction: "OUTBOUND",
                text,
                attachment_payload: null,
                timestamp: now,
                created_at: new Date(now).toISOString(),
            };
            setOptimistic((prev) => [...prev, draft]);
            pushLocalMessage(draft);

            const res = await agentSend(shopId, pageId, psid, text, channel);
            if (!res.success) {
                setOptimistic((prev) => prev.filter((m) => m.id !== draft.id));
                toast.error(res.error || "Failed to send message");
                return false;
            }
            return true;
        },
        [conversation.id, channel, psid, pageId, pushLocalMessage],
    );

    const handleTakeover = async (action: "takeover" | "handback") => {
        setTakingOver(true);
        const res = await humanTakeover(shopId, pageId, psid, action, channel);
        setTakingOver(false);
        if (res.success) {
            toast.success(action === "takeover" ? "You've taken over this chat" : "Handed back to bot");
        } else {
            toast.error(res.error || "Action failed");
        }
    };

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex h-16 shrink-0 items-center justify-between border-b px-4">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Avatar className="size-9">
                            <AvatarFallback className="text-xs">
                                {conversation.display_name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-background p-0.5 ring-1 ring-border">
                            <ChannelIcon channel={channel} className="size-3.5" />
                        </span>
                    </div>
                    <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                            {conversation.display_name}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{meta.label}</span>
                            {humanActive ? (
                                <Badge variant="secondary" className="gap-1 text-[10px]">
                                    <IconHeadset className="size-3" />
                                    You&apos;re handling this
                                </Badge>
                            ) : botActive ? (
                                <Badge variant="outline" className="gap-1 text-[10px] text-green-600 dark:text-green-500">
                                    <IconRobotFace className="size-3" />
                                    Bot active
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="gap-1 text-[10px]">
                                    <IconUser className="size-3" />
                                    Human-only mode
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    {humanActive ? (
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={takingOver}
                            onClick={() => handleTakeover("handback")}
                        >
                            <IconRobot className="mr-1.5 size-4" />
                            Hand back to bot
                        </Button>
                    ) : (
                        <Button
                            variant="default"
                            size="sm"
                            disabled={takingOver}
                            onClick={() => handleTakeover("takeover")}
                        >
                            <IconHeadset className="mr-1.5 size-4" />
                            Take over
                        </Button>
                    )}
                </div>
            </div>

            {/* Messages */}
            {loading ? (
                <div className="flex flex-1 items-center justify-center">
                    <Spinner className="size-6 text-muted-foreground" />
                </div>
            ) : (
                <MessageScrollerProvider autoScroll>
                    <MessageScroller className="flex-1 bg-muted/20">
                        <MessageScrollerViewport>
                            <MessageScrollerContent className="gap-2 p-4 *:data-message-scroller-spacer:hidden">
                                {messages.length === 0 && (
                                    <div className="py-10 text-center text-sm text-muted-foreground">
                                        No messages in this thread yet.
                                    </div>
                                )}
                                {messages.map((msg, idx) => {
                                    const prev = messages[idx - 1];
                                    const showDay =
                                        !prev || dayKey(prev.timestamp) !== dayKey(msg.timestamp);
                                    const isSystem = msg.direction === "SYSTEM";
                                    const isOutbound = msg.direction === "OUTBOUND";
                                    const dayMarker = showDay && (
                                        <Marker variant="separator" className="my-2">
                                            <MarkerContent className="text-[11px]">
                                                {dayLabel(msg.timestamp)}
                                            </MarkerContent>
                                        </Marker>
                                    );

                                    // No scrollAnchor: this is a two-party inbox, so new
                                    // messages belong at the bottom (autoScroll pins there).
                                    // Anchoring the last item makes the scroller pad a tall
                                    // spacer below it to pull it to the top — the big gap.
                                    if (isSystem) {
                                        const event = (
                                            msg.attachment_payload as { event?: SystemEvent } | null
                                        )?.event;
                                        const EventIcon = systemEventIcon(event);
                                        return (
                                            <MessageScrollerItem key={msg.renderKey}>
                                                {dayMarker}
                                                <Marker className="justify-center py-1 text-center text-xs">
                                                    <MarkerIcon>
                                                        <EventIcon />
                                                    </MarkerIcon>
                                                    <MarkerContent>
                                                        {msg.text}
                                                        <span className="ml-1.5 opacity-70">
                                                            · {timeLabel(msg.timestamp)}
                                                        </span>
                                                    </MarkerContent>
                                                </Marker>
                                            </MessageScrollerItem>
                                        );
                                    }

                                    return (
                                        <MessageScrollerItem key={msg.renderKey}>
                                            {dayMarker}
                                            <Message align={isOutbound ? "end" : "start"}>
                                                <MessageContent>
                                                    <Bubble
                                                        variant={isOutbound ? "default" : "muted"}
                                                        align={isOutbound ? "end" : "start"}
                                                    >
                                                        <BubbleContent>
                                                            {msg.text ||
                                                                (msg.attachment_payload
                                                                    ? "📎 Attachment"
                                                                    : "")}
                                                        </BubbleContent>
                                                    </Bubble>
                                                    <MessageFooter>
                                                        {timeLabel(msg.timestamp)}
                                                    </MessageFooter>
                                                </MessageContent>
                                            </Message>
                                        </MessageScrollerItem>
                                    );
                                })}
                            </MessageScrollerContent>
                        </MessageScrollerViewport>
                        <MessageScrollerButton variant="secondary" size="icon-sm" />
                    </MessageScroller>
                </MessageScrollerProvider>
            )}

            <Composer onSend={handleSend} />
        </div>
    );
}
